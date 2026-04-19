import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoUsers } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppUser, AuthMode, UserRole } from "@/lib/types";

export const DEMO_USER_COOKIE = "acams-demo-user";

export function getAuthMode(): AuthMode {
  return hasSupabaseEnv() ? "supabase" : "demo";
}

function getDemoUser(userId: string | undefined) {
  return demoUsers.find((user) => user.id === userId) ?? demoUsers[0];
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (getAuthMode() === "demo") {
    const cookieStore = await cookies();
    const userId = cookieStore.get(DEMO_USER_COOKIE)?.value;
    return getDemoUser(userId);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, primary_brand_id, agency_name, access_expires_at, is_active")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  const { data: grants } = await supabase
    .from("cross_brand_grants")
    .select("brand_id")
    .eq("user_id", user.id)
    .is("revoked_at", null);

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role as UserRole,
    primaryBrandId: profile.primary_brand_id,
    grantedBrandIds: (grants ?? []).map((grant) => grant.brand_id),
    isActive: profile.is_active,
    agencyName: profile.agency_name ?? undefined,
    accessExpiresAt: profile.access_expires_at ?? undefined,
    mode: "supabase",
  };
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user || !user.isActive) {
    redirect("/login");
  }

  return user;
}
