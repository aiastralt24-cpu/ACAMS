"use server";

import { redirect } from "next/navigation";
import { getAuthMode, requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function grantBrandAccessAction(formData: FormData) {
  const user = await requireUser();

  if (user.role !== "super_admin") {
    redirect("/access?error=Only+the+central+team+can+manage+cross-brand+access.");
  }

  if (getAuthMode() === "demo") {
    redirect("/access?message=Access+changes+will+be+enabled+for+live+accounts.");
  }

  const targetUserId = String(formData.get("userId") ?? "");
  const brandId = String(formData.get("brandId") ?? "");

  if (!targetUserId || !brandId) {
    redirect("/access?error=Choose+both+the+user+and+the+brand+before+saving.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: brand } = await supabase.from("brands").select("name").eq("id", brandId).single();
  const { error } = await supabase.from("cross_brand_grants").upsert({
    user_id: targetUserId,
    brand_id: brandId,
    granted_by: user.id,
    revoked_at: null,
  });

  if (error) {
    redirect(`/access?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "grant",
    entity_type: "cross_brand_grant",
    metadata: {
      summary: `${user.fullName} granted access to ${brand?.name ?? "the selected workspace"}.`,
      brandName: brand?.name ?? "Brand workspace",
      entityTitle: "Cross-brand access grant",
    },
  });

  redirect("/access?message=Cross-brand+access+saved+successfully");
}

export async function revokeBrandAccessAction(formData: FormData) {
  const user = await requireUser();

  if (user.role !== "super_admin") {
    redirect("/access?error=Only+the+central+team+can+revoke+cross-brand+access.");
  }

  if (getAuthMode() === "demo") {
    redirect("/access?message=Access+changes+will+be+enabled+for+live+accounts.");
  }

  const grantId = String(formData.get("grantId") ?? "");

  if (!grantId) {
    redirect("/access?error=The+selected+grant+could+not+be+found.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("cross_brand_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", grantId);

  if (error) {
    redirect(`/access?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "grant",
    entity_type: "cross_brand_grant",
    metadata: {
      summary: `${user.fullName} revoked a cross-brand access grant.`,
      entityTitle: "Cross-brand access revoke",
    },
  });

  redirect("/access?message=Cross-brand+access+removed");
}
