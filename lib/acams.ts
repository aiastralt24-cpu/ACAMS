import { cache } from "react";
import { getAuthMode, getCurrentUser } from "@/lib/auth";
import {
  demoAccessGrants,
  demoApprovalQueue,
  demoAssetDetails,
  demoAssets,
  demoAuditEvents,
  demoBrands,
  demoDashboardData,
  demoUsers,
} from "@/lib/demo-data";
import { deriveAssetBucketName } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActivityReport,
  AccessGrantRecord,
  AppUser,
  ApprovalQueueItem,
  AssetDetail,
  AssetHistoryEntry,
  AssetRecord,
  AuditEvent,
  BrandRecord,
  DashboardData,
} from "@/lib/types";

export function userCanAccessBrand(user: AppUser, brandId: string | null) {
  if (brandId === null) {
    return true;
  }

  if (user.role === "super_admin") {
    return true;
  }

  return user.primaryBrandId === brandId || user.grantedBrandIds.includes(brandId);
}

export function userCanManageBrand(user: AppUser, brandId: string | null) {
  if (brandId === null) {
    return user.role === "super_admin";
  }

  if (user.role === "super_admin") {
    return true;
  }

  return user.primaryBrandId === brandId;
}

function mapAssetRecord(asset: {
  id: string;
  brand_id: string | null;
  title: string;
  description: string | null;
  category: string;
  platform: string | null;
  campaign_name: string | null;
  product_name: string | null;
  mime_type: string;
  version_label: string;
  status: string;
  uploaded_by: string;
  storage_path?: string | null;
  thumbnail_path?: string | null;
  created_at: string;
  brands?: { name: string | null; slug?: string | null }[] | { name: string | null; slug?: string | null } | null;
  profiles?: { full_name: string | null }[] | { full_name: string | null } | null;
  asset_tags?: { tag: string }[] | null;
}): AssetRecord {
  const brand = Array.isArray(asset.brands) ? asset.brands[0] : asset.brands;
  const profile = Array.isArray(asset.profiles) ? asset.profiles[0] : asset.profiles;
  const fileType = asset.mime_type.includes("/") ? (asset.mime_type.split("/")[1] ?? asset.mime_type) : asset.mime_type;

  return {
    id: asset.id,
    brandId: asset.brand_id,
    brandName: brand?.name ?? "Shared Library",
    brandSlug: brand?.slug ?? null,
    title: asset.title,
    description: asset.description,
    category: asset.category,
    platform: asset.platform,
    campaignName: asset.campaign_name,
    productName: asset.product_name,
    fileType,
    versionLabel: asset.version_label,
    status: asset.status as AssetRecord["status"],
    uploadedById: asset.uploaded_by,
    uploadedByName: profile?.full_name ?? "Unknown uploader",
    thumbnailUrl: null,
    tags: asset.asset_tags?.map((tag) => tag.tag) ?? [],
    isShared: asset.brand_id === null,
    createdAt: asset.created_at,
  };
}

type PreviewCandidate = AssetRecord & {
  storagePath?: string | null;
  thumbnailPath?: string | null;
};

async function attachSignedPreviews(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  records: PreviewCandidate[],
): Promise<AssetRecord[]> {
  return Promise.all(
    records.map(async (record) => {
      const canPreviewOriginal = /^(png|jpe?g|webp|gif|svg)$/i.test(record.fileType);
      const previewPath = record.thumbnailPath || (canPreviewOriginal ? record.storagePath : null);

      if (!previewPath) {
        return record;
      }

      const { data } = await supabase.storage
        .from(deriveAssetBucketName(record.brandId))
        .createSignedUrl(previewPath, 60 * 10);

      return {
        ...record,
        thumbnailUrl: data?.signedUrl ?? null,
      };
    }),
  );
}

function extractProfileName(
  profile: { full_name: string | null }[] | { full_name: string | null } | null | undefined,
) {
  if (Array.isArray(profile)) {
    return profile[0]?.full_name ?? undefined;
  }

  return profile?.full_name ?? undefined;
}

export const getBrands = cache(async (): Promise<BrandRecord[]> => {
  if (getAuthMode() === "demo") {
    return demoBrands;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("brands").select("id, slug, name, business_unit, description").order("name");

  return (data ?? []).map((brand) => ({
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    businessUnit: brand.business_unit,
    description: brand.description,
  }));
});

export async function getVisibleBrandsForUser(user: AppUser): Promise<BrandRecord[]> {
  const brands = await getBrands();
  return brands.filter((brand) => userCanAccessBrand(user, brand.id));
}

export async function getManageableBrandsForUser(user: AppUser): Promise<BrandRecord[]> {
  const brands = await getBrands();
  return brands.filter((brand) => userCanManageBrand(user, brand.id));
}

export const getVisibleAssetsForUser = cache(async (user: AppUser): Promise<AssetRecord[]> => {
  if (getAuthMode() === "demo") {
    return demoAssets.filter(
      (asset) => userCanAccessBrand(user, asset.brandId) && (asset.status !== "archived" || userCanManageBrand(user, asset.brandId)),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("assets")
    .select(
      "id, brand_id, title, description, category, platform, campaign_name, product_name, mime_type, version_label, status, uploaded_by, storage_path, thumbnail_path, created_at, brands(name,slug), profiles!assets_uploaded_by_fkey(full_name), asset_tags(tag)",
    )
    .order("created_at", { ascending: false });

  const records = ((data ?? []) as unknown[]).map((asset) => {
    const source = asset as Parameters<typeof mapAssetRecord>[0];

    return {
      ...mapAssetRecord(source),
      storagePath: source.storage_path,
      thumbnailPath: source.thumbnail_path,
    };
  });

  const scopedRecords = records.filter(
    (asset) => asset.status !== "archived" || userCanManageBrand(user, asset.brandId),
  );

  return attachSignedPreviews(supabase, scopedRecords);
});

export async function getVisibleAssetsForBrand(user: AppUser, brandId: string) {
  const assets = await getVisibleAssetsForUser(user);
  return assets.filter((asset) => asset.brandId === brandId);
}

export async function getSharedAssets(user: AppUser) {
  const assets = await getVisibleAssetsForUser(user);
  return assets.filter((asset) => asset.isShared);
}

export async function getBrandBySlug(slug: string) {
  const brands = await getBrands();
  return brands.find((brand) => brand.slug === slug);
}

export async function getDashboardData(user: AppUser): Promise<DashboardData> {
  if (getAuthMode() === "demo") {
    const visibleBrands = await getVisibleBrandsForUser(user);
    return {
      ...demoDashboardData,
      latestAssets: demoDashboardData.latestAssets.filter((asset) => userCanAccessBrand(user, asset.brandId)),
      brandsCount: visibleBrands.length,
    };
  }

  const [assets, brands, approvals, auditEvents] = await Promise.all([
    getVisibleAssetsForUser(user),
    getVisibleBrandsForUser(user),
    getApprovalQueue(user),
    getAuditEvents(user),
  ]);

  return {
    approvedCount: assets.filter((asset) => asset.status === "approved").length,
    pendingCount: approvals.length,
    brandsCount: brands.length,
    sharedAssetsCount: assets.filter((asset) => asset.isShared).length,
    latestAssets: assets.slice(0, 5),
    recentActivity: auditEvents.slice(0, 5),
  };
}

export async function getApprovalQueue(user: AppUser): Promise<ApprovalQueueItem[]> {
  if (getAuthMode() === "demo") {
    if (user.role === "super_admin") {
      return demoApprovalQueue;
    }

    if (user.role === "brand_admin" && user.primaryBrandId) {
      return demoApprovalQueue.filter((item) => {
        const asset = demoAssets.find((candidate) => candidate.id === item.assetId);
        return asset?.brandId === user.primaryBrandId;
      });
    }

    return [];
  }

  if (user.role !== "super_admin" && user.role !== "brand_admin") {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("assets")
    .select("id, title, category, platform, version_label, created_at, brands(name), profiles!assets_uploaded_by_fkey(full_name)")
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false });

  if (user.role === "brand_admin" && user.primaryBrandId) {
    query = query.eq("brand_id", user.primaryBrandId);
  }

  const { data } = await query;

  return ((data ?? []) as Array<Record<string, unknown>>).map((asset) => {
    const brand = Array.isArray(asset.brands) ? asset.brands[0] : asset.brands;
    const profile = Array.isArray(asset.profiles) ? asset.profiles[0] : asset.profiles;

    return ({
      id: String(asset.id),
      assetId: String(asset.id),
      assetTitle: String(asset.title),
      brandName: typeof brand === "object" && brand && "name" in brand ? String(brand.name ?? "Shared Library") : "Shared Library",
      uploadedByName:
        typeof profile === "object" && profile && "full_name" in profile
          ? String(profile.full_name ?? "Unknown uploader")
          : "Unknown uploader",
      category: String(asset.category ?? ""),
      platform: typeof asset.platform === "string" ? asset.platform : null,
      versionLabel: String(asset.version_label ?? ""),
      submittedAt: String(asset.created_at ?? ""),
      reviewerRole: user.role,
    });
  });
}

function inferAuditType(action: string): AuditEvent["eventType"] {
  if (action === "approve" || action === "reject") {
    return "approval";
  }

  if (action === "download") {
    return "download";
  }

  if (action === "grant") {
    return "grant";
  }

  if (action === "archive") {
    return "archive";
  }

  if (action === "delete") {
    return "delete";
  }

  return "upload";
}

function buildActivityReport(events: AuditEvent[]): ActivityReport {
  const counts = {
    upload: 0,
    approval: 0,
    download: 0,
    grant: 0,
    archive: 0,
    delete: 0,
  };
  const brandMap = new Map<string, number>();

  for (const event of events) {
    counts[event.eventType] += 1;

    const label = event.brandName?.trim() || "Shared Library";
    brandMap.set(label, (brandMap.get(label) ?? 0) + 1);
  }

  return {
    totalEvents: events.length,
    uploads: counts.upload,
    approvals: counts.approval,
    downloads: counts.download,
    grants: counts.grant,
    latestEventAt: events[0]?.createdAt ?? null,
    topBrands: Array.from(brandMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, count })),
    eventMix: [
      { label: "Uploads", count: counts.upload },
      { label: "Approvals", count: counts.approval },
      { label: "Downloads", count: counts.download },
      { label: "Grants", count: counts.grant },
      { label: "Archives", count: counts.archive },
      { label: "Deletes", count: counts.delete },
    ],
  };
}

export async function getAuditEvents(_user: AppUser): Promise<AuditEvent[]> {
  if (getAuthMode() === "demo") {
    return demoAuditEvents;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, action, metadata, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((event) => ({
    id: event.id,
    eventType: inferAuditType(event.action),
    title: event.action.replaceAll("_", " "),
    summary: typeof event.metadata?.summary === "string" ? event.metadata.summary : "Audit event recorded.",
    actorName: extractProfileName(event.profiles),
    brandName: typeof event.metadata?.brandName === "string" ? event.metadata.brandName : undefined,
    entityTitle: typeof event.metadata?.entityTitle === "string" ? event.metadata.entityTitle : undefined,
    createdAt: event.created_at,
  }));
}

export async function getActivityReport(user: AppUser): Promise<ActivityReport> {
  const events = await getAuditEvents(user);
  return buildActivityReport(events);
}

export async function getAccessGrants(user: AppUser): Promise<AccessGrantRecord[]> {
  if (user.role !== "super_admin") {
    return [];
  }

  if (getAuthMode() === "demo") {
    return demoAccessGrants;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("cross_brand_grants")
    .select("id, user_id, brand_id, created_at, profiles!cross_brand_grants_user_id_fkey(full_name,email), brands(name), grantor:profiles!cross_brand_grants_granted_by_fkey(full_name)")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  return (data ?? []).map((grant) => {
    const profile = Array.isArray(grant.profiles) ? grant.profiles[0] : grant.profiles;
    const brand = Array.isArray(grant.brands) ? grant.brands[0] : grant.brands;
    const grantor = Array.isArray(grant.grantor) ? grant.grantor[0] : grant.grantor;

    return {
      id: grant.id,
      userId: grant.user_id,
      userName: profile?.full_name ?? "Workspace user",
      userEmail: profile?.email ?? "",
      brandId: grant.brand_id,
      brandName: brand?.name ?? "Brand workspace",
      grantedAt: grant.created_at,
      grantedByName: grantor?.full_name ?? undefined,
    };
  });
}

export async function getManageableUsers(user: AppUser): Promise<Array<{ id: string; fullName: string; email: string }>> {
  if (user.role !== "super_admin") {
    return [];
  }

  if (getAuthMode() === "demo") {
    return demoUsers.map((profile) => ({
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
    }));
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .order("full_name");

  return (data ?? []).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
  }));
}

export async function getAssetDetail(user: AppUser, assetId: string): Promise<AssetDetail | null> {
  if (getAuthMode() === "demo") {
    const detail = demoAssetDetails[assetId];
    if (!detail || !userCanAccessBrand(user, detail.asset.brandId)) {
      return null;
    }
    return detail;
  }

  const supabase = await createSupabaseServerClient();
  const { data: asset } = await supabase
    .from("assets")
    .select(
      "id, brand_id, title, description, category, platform, campaign_name, product_name, mime_type, version_label, status, uploaded_by, storage_path, thumbnail_path, created_at, brands(name,slug), profiles!assets_uploaded_by_fkey(full_name), asset_tags(tag)",
    )
    .eq("id", assetId)
    .single();

  if (!asset) {
    return null;
  }

  const source = asset as Parameters<typeof mapAssetRecord>[0];
  const [assetRecord] = await attachSignedPreviews(supabase, [
    {
      ...mapAssetRecord(source),
      storagePath: source.storage_path,
      thumbnailPath: source.thumbnail_path,
    },
  ]);

  if (assetRecord.status === "archived" && !userCanManageBrand(user, assetRecord.brandId)) {
    return null;
  }

  const history = await getAssetHistory(assetId);
  return {
    asset: assetRecord,
    history,
  };
}

export async function getAssetHistory(assetId: string): Promise<AssetHistoryEntry[]> {
  if (getAuthMode() === "demo") {
    return demoAssetDetails[assetId]?.history ?? [];
  }

  const supabase = await createSupabaseServerClient();
  const [approvalsResult, downloadsResult, auditResult] = await Promise.all([
    supabase.from("approvals").select("id, action, comment, created_at").eq("asset_id", assetId).order("created_at", { ascending: false }),
    supabase.from("downloads").select("id, variant, created_at").eq("asset_id", assetId).order("created_at", { ascending: false }),
    supabase
      .from("audit_log")
      .select("id, action, metadata, created_at")
      .eq("entity_type", "asset")
      .eq("entity_id", assetId)
      .in("action", ["archive", "delete"])
      .order("created_at", { ascending: false }),
  ]);

  const approvalHistory: AssetHistoryEntry[] = (approvalsResult.data ?? []).map((entry) => ({
    id: entry.id,
    type: "approval",
    title: entry.action === "approved" ? "Approved" : "Rejected",
    summary: entry.comment ?? "Approval action recorded.",
    createdAt: entry.created_at,
  }));

  const downloadHistory: AssetHistoryEntry[] = (downloadsResult.data ?? []).map((entry) => ({
    id: entry.id,
    type: "download",
    title: "Downloaded",
    summary: `Downloaded as ${entry.variant}.`,
    createdAt: entry.created_at,
  }));

  const auditHistory: AssetHistoryEntry[] = (auditResult.data ?? []).map((entry) => ({
    id: entry.id,
    type: entry.action === "archive" ? "archive" : "delete",
    title: entry.action === "archive" ? "Archived" : "Deleted",
    summary: typeof entry.metadata?.summary === "string" ? entry.metadata.summary : "Admin action recorded.",
    createdAt: entry.created_at,
  }));

  return [...approvalHistory, ...downloadHistory, ...auditHistory].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getAppContext() {
  const [user, brands] = await Promise.all([getCurrentUser(), getBrands()]);
  return {
    user,
    brands: user ? brands.filter((brand) => userCanAccessBrand(user, brand.id)) : [],
    mode: getAuthMode(),
  };
}
