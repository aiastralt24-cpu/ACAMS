"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_USER_COOKIE, getAuthMode } from "@/lib/auth";
import {
  isValidDemoLogin,
  resolveLoginEmail,
  SUPER_ADMIN_DEMO_USER_ID,
} from "@/lib/login-credentials";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  if (getAuthMode() === "demo") {
    if (!isValidDemoLogin(identifier, password)) {
      redirect("/login?error=Invalid%20user%20ID%20or%20password");
    }

    const cookieStore = await cookies();
    cookieStore.set(DEMO_USER_COOKIE, SUPER_ADMIN_DEMO_USER_ID, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect("/");
  }

  const email = resolveLoginEmail(identifier);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function logoutAction() {
  if (getAuthMode() === "demo") {
    const cookieStore = await cookies();
    cookieStore.delete(DEMO_USER_COOKIE);
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
