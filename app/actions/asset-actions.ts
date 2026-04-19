"use server";

import { redirect } from "next/navigation";
import { getAuthMode, requireUser } from "@/lib/auth";
import { userCanManageBrand } from "@/lib/acams";
import { deriveAssetBucketName } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function extractJoinedBrandName(
  brand: { name: string | null }[] | { name: string | null } | null | undefined,
) {
  if (Array.isArray(brand)) {
    return brand[0]?.name ?? undefined;
  }

  return brand?.name ?? undefined;
}

export async function createAssetAction(formData: FormData) {
  const user = await requireUser();

  if (getAuthMode() === "demo") {
    redirect("/uploads/new?message=Uploads+will+be+enabled+for+live+accounts.");
  }

  const rawBrandId = String(formData.get("brandId") ?? "");
  const brandId = rawBrandId === "shared" ? null : rawBrandId;
  const brandLabel = String(formData.get("brandLabel") ?? "");
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  const category = String(formData.get("category") ?? "");
  const platform = String(formData.get("platform") ?? "");
  const productName = String(formData.get("productName") ?? "");
  const campaignName = String(formData.get("campaignName") ?? "");
  const versionLabel = String(formData.get("versionLabel") ?? "v1");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const file = formData.get("file");

  if (!(file instanceof File) || !title || !category) {
    redirect("/uploads/new?error=Missing+required+upload+data.");
  }

  if (!userCanManageBrand(user, brandId)) {
    redirect("/uploads/new?error=You+cannot+upload+into+that+workspace.");
  }

  if (brandId === null && user.role !== "super_admin") {
    redirect("/uploads/new?error=Only+the+central+team+can+publish+to+the+shared+library.");
  }

  const supabase = await createSupabaseServerClient();
  const bucketName = deriveAssetBucketName(brandId);
  const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
  const storagePath = `${brandId ?? "shared"}/${Date.now()}-${safeName}`;
  const initialStatus =
    user.role === "super_admin" || user.role === "brand_admin" ? "approved" : "pending_approval";

  let familyQuery = supabase
    .from("assets")
    .select("id, parent_asset_id, status, version_label")
    .eq("title", title)
    .eq("category", category)
    .eq("uploaded_by", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (brandId === null) {
    familyQuery = familyQuery.is("brand_id", null);
  } else {
    familyQuery = familyQuery.eq("brand_id", brandId);
  }

  if (platform) {
    familyQuery = familyQuery.eq("platform", platform);
  } else {
    familyQuery = familyQuery.is("platform", null);
  }

  if (productName) {
    familyQuery = familyQuery.eq("product_name", productName);
  } else {
    familyQuery = familyQuery.is("product_name", null);
  }

  const { data: matchingAssets } = await familyQuery;
  const duplicateVersion = (matchingAssets ?? []).find((asset) => asset.version_label === versionLabel);

  if (duplicateVersion) {
    redirect("/uploads/new?error=This+version+already+exists+for+the+same+route.+Choose+a+new+version+label.");
  }

  const latestFamilyAsset = matchingAssets?.[0];
  const parentAssetId = latestFamilyAsset?.parent_asset_id ?? latestFamilyAsset?.id ?? null;

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(storagePath, file, {
    upsert: false,
  });

  if (uploadError) {
    redirect(`/uploads/new?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { data: insertedAsset, error: assetError } = await supabase
    .from("assets")
    .insert({
      brand_id: brandId,
      title,
      description: description || null,
      category,
      platform: platform || null,
      product_name: productName || null,
      campaign_name: campaignName || null,
      version_label: versionLabel,
      status: initialStatus,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      file_size_bytes: file.size,
      parent_asset_id: parentAssetId,
      latest_approved_version: initialStatus === "approved",
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (assetError || !insertedAsset) {
    redirect(
      `/uploads/new?error=${encodeURIComponent(assetError?.message ?? "Failed to create asset record.")}`,
    );
  }

  if (tags.length) {
    await supabase.from("asset_tags").insert(
      tags.map((tag) => ({
        asset_id: insertedAsset.id,
        tag,
      })),
    );
  }

  if (initialStatus === "approved") {
    const familyRootId = parentAssetId ?? insertedAsset.id;
    await supabase
      .from("assets")
      .update({ latest_approved_version: false, updated_at: new Date().toISOString() })
      .or(`id.eq.${familyRootId},parent_asset_id.eq.${familyRootId}`)
      .neq("id", insertedAsset.id);
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "upload",
    entity_type: "asset",
    entity_id: insertedAsset.id,
    metadata: {
      summary: `${user.fullName} uploaded ${title}.`,
      brandName: brandId === null ? "Shared Library" : brandLabel || rawBrandId,
      entityTitle: title,
    },
  });

  redirect("/?message=Asset+uploaded+successfully");
}

export async function reviewAssetAction(formData: FormData) {
  const user = await requireUser();

  if (user.role !== "super_admin" && user.role !== "brand_admin") {
    redirect("/approvals?error=You+do+not+have+permission+to+review+assets.");
  }

  if (getAuthMode() === "demo") {
    redirect("/approvals?message=Reviews+will+be+enabled+for+live+accounts.");
  }

  const assetId = String(formData.get("assetId") ?? "");
  const action = String(formData.get("action") ?? "");
  const comment = String(formData.get("comment") ?? "");

  if (!assetId || (action !== "approved" && action !== "rejected")) {
    redirect("/approvals?error=Invalid+review+request.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: assetToReview } = await supabase
    .from("assets")
    .select("id, title, brand_id, parent_asset_id, brands(name)")
    .eq("id", assetId)
    .single();

  if (!assetToReview) {
    redirect("/approvals?error=The+selected+asset+could+not+be+found.");
  }

  if (!userCanManageBrand(user, assetToReview.brand_id)) {
    redirect("/approvals?error=You+cannot+review+assets+outside+your+workspace.");
  }

  if (action === "approved") {
    const familyRootId = assetToReview.parent_asset_id ?? assetToReview.id;
    await supabase
      .from("assets")
      .update({ latest_approved_version: false, updated_at: new Date().toISOString() })
      .or(`id.eq.${familyRootId},parent_asset_id.eq.${familyRootId}`)
      .neq("id", assetToReview.id);
  }

  const { error: updateError } = await supabase
    .from("assets")
    .update({
      status: action,
      latest_approved_version: action === "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (updateError) {
    redirect(`/approvals?error=${encodeURIComponent(updateError.message)}`);
  }

  await supabase.from("approvals").insert({
    asset_id: assetId,
    reviewed_by: user.id,
    action,
    comment: comment || null,
  });

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: action === "approved" ? "approve" : "reject",
    entity_type: "asset",
    entity_id: assetId,
    metadata: {
      summary: `${user.fullName} ${action === "approved" ? "approved" : "rejected"} ${assetToReview.title}.`,
      brandName:
        assetToReview.brand_id === null
          ? "Shared Library"
          : extractJoinedBrandName(assetToReview.brands) ?? "Brand workspace",
      entityTitle: assetToReview.title,
    },
  });

  redirect(`/approvals?message=Asset+${action === "approved" ? "approved" : "rejected"}+successfully`);
}

export async function deleteAssetAction(formData: FormData) {
  const user = await requireUser();

  if (user.role !== "super_admin") {
    redirect("/?error=Only+Super+Admin+can+delete+assets.");
  }

  if (getAuthMode() === "demo") {
    redirect("/?message=Delete+will+be+enabled+for+live+accounts.");
  }

  const assetId = String(formData.get("assetId") ?? "");

  if (!assetId) {
    redirect("/?error=Invalid+asset+delete+request.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: asset } = await supabase
    .from("assets")
    .select("id, title, brand_id, storage_path, thumbnail_path, brands(name)")
    .eq("id", assetId)
    .single();

  if (!asset) {
    redirect("/?error=Asset+could+not+be+found.");
  }

  const bucketName = deriveAssetBucketName(asset.brand_id);
  const storagePaths = [asset.storage_path, asset.thumbnail_path].filter(Boolean) as string[];

  if (storagePaths.length) {
    await supabase.storage.from(bucketName).remove(storagePaths);
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "delete",
    entity_type: "asset",
    entity_id: asset.id,
    metadata: {
      summary: `${user.fullName} deleted ${asset.title}.`,
      brandName:
        asset.brand_id === null
          ? "Shared Library"
          : extractJoinedBrandName(asset.brands) ?? "Brand workspace",
      entityTitle: asset.title,
    },
  });

  const { error: deleteError } = await supabase.from("assets").delete().eq("id", assetId);

  if (deleteError) {
    redirect(`/assets/${assetId}?error=${encodeURIComponent(deleteError.message)}`);
  }

  redirect("/?message=Asset+deleted+successfully");
}
