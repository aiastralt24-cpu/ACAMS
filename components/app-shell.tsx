import Link from "next/link";
import { headers } from "next/headers";
import { logoutAction } from "@/app/login/actions";
import { getAppContext, getSharedAssets } from "@/lib/acams";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-acams-pathname");

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const { user, brands } = await getAppContext();
  const sharedAssets = user ? await getSharedAssets(user) : [];
  const isReviewer = user?.role === "super_admin" || user?.role === "brand_admin";
  const isSuperAdmin = user?.role === "super_admin";
  const roleLabel = user ? user.role.replaceAll("_", " ") : "Sign in required";
  const currentWorkspace =
    brands.find((brand) => pathname?.startsWith(`/brands/${brand.slug}`)) ??
    brands.find((brand) => brand.id === user?.primaryBrandId) ??
    brands[0];

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

  const isActive = (href: string) => {
    if (!pathname) {
      return false;
    }

    return href === "/" ? pathname === href : pathname.startsWith(href);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-badge">A</span>
          <div>
            <h1>ACAMS</h1>
            <p>Brand control layer</p>
          </div>
        </div>

        <nav className="nav-group" aria-label="Primary">
          {navItems.map((item) => (
            <Link className={`nav-link ${isActive(item.href) ? "nav-link-active" : ""}`} href={item.href} key={item.href}>
              <span className="nav-link-main">
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {typeof item.count === "number" ? <span className="nav-pill">{item.count}</span> : null}
            </Link>
          ))}
        </nav>

        {adminItems.length ? (
          <nav className="nav-group nav-group-tight" aria-label="Admin">
            <p className="nav-label">Admin</p>
            {adminItems.map((item) => (
              <Link className={`nav-link nav-link-subtle ${isActive(item.href) ? "nav-link-active" : ""}`} href={item.href} key={item.href}>
                <span className="nav-link-main">
                  <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>
        ) : null}

        <section className="workspace-switcher" aria-label="Workspace switcher">
          <p className="nav-label">Workspaces</p>
          {currentWorkspace ? (
            <Link className="workspace-current" href={`/brands/${currentWorkspace.slug}`}>
              <span className="workspace-avatar" aria-hidden="true">
                {currentWorkspace.name.replace("Astral ", "").slice(0, 1)}
              </span>
              <span>
                <strong>{currentWorkspace.name}</strong>
                <small>{currentWorkspace.businessUnit}</small>
              </span>
            </Link>
          ) : null}
          <div className="workspace-list-nav">
            {brands
              .filter((brand) => brand.id !== currentWorkspace?.id)
              .map((brand) => (
                <Link className={`workspace-link-nav ${isActive(`/brands/${brand.slug}`) ? "workspace-link-nav-active" : ""}`} href={`/brands/${brand.slug}`} key={brand.id}>
                  <span>{brand.name}</span>
                </Link>
              ))}
          </div>
        </section>

        <div className="sidebar-note">
          <div className="account-avatar" aria-hidden="true">
            {(user?.fullName ?? "G").slice(0, 1)}
          </div>
          <div className="account-copy">
            <strong>{user ? user.fullName : "Guest"}</strong>
            <span>{roleLabel}</span>
          </div>
          {user ? (
            <form action={logoutAction} className="sidebar-form">
              <button className="button button-ghost" type="submit">
                Sign out
              </button>
            </form>
          ) : null}
        </div>
      </aside>

      <div className="content">{children}</div>
    </div>
  );
}
