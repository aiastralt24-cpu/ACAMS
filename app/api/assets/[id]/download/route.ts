import { NextResponse } from "next/server";
import { getAssetDetail } from "@/lib/acams";
import { getAuthMode, getCurrentUser } from "@/lib/auth";
import { deriveAssetBucketName } from "@/lib/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DownloadRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: DownloadRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", "http://localhost:3000"));
  }

  const { id } = await params;
  const detail = await getAssetDetail(user, id);

  if (!detail) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (getAuthMode() === "demo") {
    return NextResponse.redirect(new URL(`/assets/${id}?message=Download+will+be+enabled+for+live+accounts.`, "http://localhost:3000"));
  }

  const supabase = await createSupabaseServerClient();
  const { data: assetRow } = await supabase
    .from("assets")
    .select("storage_path, brand_id")
    .eq("id", id)
    .single();

  if (!assetRow) {
    return NextResponse.json({ error: "Asset file missing" }, { status: 404 });
  }

  const bucket = deriveAssetBucketName(assetRow.brand_id);
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(assetRow.storage_path, 60 * 5);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Unable to generate download link" }, { status: 500 });
  }

  await supabase.from("downloads").insert({
    asset_id: id,
    downloaded_by: user.id,
    variant: "original",
  });

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "download",
    entity_type: "asset",
    entity_id: id,
    metadata: {
      summary: `${user.fullName} downloaded asset ${id}.`,
    },
  });

  return NextResponse.redirect(data.signedUrl);
}
