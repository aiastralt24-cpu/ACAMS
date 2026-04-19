import { headers } from "next/headers";
import { logoutAction } from "@/app/login/actions";
import { getAppContext, getSharedAssets } from "@/lib/acams";
import { SidebarNav } from "@/components/sidebar-nav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-acams-pathname");

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const { user, brands } = await getAppContext();
  const sharedAssets = user ? await getSharedAssets(user) : [];
  const isReviewer = user?.role === "super_admin" || user?.role === "brand_admin";
  const isSuperAdmin = user?.role === "super_admin";

  const navItems = [
    { href: "/", label: "Library", icon: "L" },
    { href: "/uploads/new", label: "Upload", icon: "U" },
    ...(isReviewer ? [{ href: "/approvals", label: "Reviews", icon: "R" }] : []),
    { href: "/shared", label: "Shared", icon: "S", count: sharedAssets.length },
  ];

  const adminItems = isSuperAdmin
    ? [
        { href: "/activity", label: "Activity", icon: "A" },
        { href: "/access", label: "Access", icon: "P" },
      ]
    : [];

  return (
    <div className="app-shell">
      <SidebarNav
        adminItems={adminItems}
        brands={brands}
        logoutAction={logoutAction}
        navItems={navItems}
        user={user}
      />

      <div className="content">{children}</div>
    </div>
  );
}
