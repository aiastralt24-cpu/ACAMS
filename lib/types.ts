export type UserRole = "super_admin" | "brand_admin" | "brand_member" | "agency_partner";
export type AuthMode = "demo" | "supabase";

export type AssetStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "archived";

export type BrandRecord = {
  id: string;
  slug: string;
  name: string;
  businessUnit: string;
  description: string;
};

export type UserRecord = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  primaryBrandId: string | null;
  grantedBrandIds: string[];
  isActive: boolean;
  agencyName?: string;
  accessExpiresAt?: string;
};

export type AppUser = UserRecord & {
  mode: AuthMode;
};

export type AssetRecord = {
  id: string;
  brandId: string | null;
  brandName: string;
  brandSlug?: string | null;
  title: string;
  description: string | null;
  category: string;
  platform: string | null;
  campaignName: string | null;
  productName: string | null;
  fileType: string;
  versionLabel: string;
  status: AssetStatus;
  uploadedById: string;
  uploadedByName: string;
  thumbnailUrl?: string | null;
  tags: string[];
  isShared: boolean;
  createdAt: string;
};

export type ApprovalQueueItem = {
  id: string;
  assetId: string;
  assetTitle: string;
  brandName: string;
  uploadedByName: string;
  reviewerRole: UserRole;
  category?: string;
  platform?: string | null;
  versionLabel?: string;
  submittedAt?: string;
  comment?: string;
};

export type AuditEvent = {
  id: string;
  eventType: "upload" | "approval" | "download" | "grant";
  title: string;
  summary: string;
  actorName?: string;
  brandName?: string;
  entityTitle?: string;
  createdAt: string;
};

export type ActivityReport = {
  totalEvents: number;
  uploads: number;
  approvals: number;
  downloads: number;
  grants: number;
  latestEventAt: string | null;
  topBrands: Array<{
    label: string;
    count: number;
  }>;
  eventMix: Array<{
    label: string;
    count: number;
  }>;
};

export type AccessGrantRecord = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  brandId: string;
  brandName: string;
  grantedAt: string;
  grantedByName?: string;
};

export type DashboardData = {
  approvedCount: number;
  pendingCount: number;
  brandsCount: number;
  sharedAssetsCount: number;
  latestAssets: AssetRecord[];
  recentActivity: AuditEvent[];
};

export type AssetHistoryEntry = {
  id: string;
  type: "version" | "approval" | "download";
  title: string;
  summary: string;
  createdAt: string;
};

export type AssetDetail = {
  asset: AssetRecord;
  history: AssetHistoryEntry[];
};
