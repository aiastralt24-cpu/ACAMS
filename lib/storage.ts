export function deriveAssetBucketName(brandId: string | null) {
  if (!brandId) {
    return "shared-library";
  }

  return brandId.replace("brand-", "astral-") + "-assets";
}
