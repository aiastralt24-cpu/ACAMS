"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { AppUser, BrandRecord } from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  count?: number;
};

type SidebarNavProps = {
  adminItems: NavItem[];
  brands: BrandRecord[];
  navItems: NavItem[];
  user: AppUser | null;
  logoutAction: () => Promise<void>;
};

function NavIcon({ kind }: { kind: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (kind === "U") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M12 4v10" />
        <path d="m8 8 4-4 4 4" />
        <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
      </svg>
    );
  }

  if (kind === "R") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M8 6h10" />
        <path d="M8 12h10" />
        <path d="M8 18h7" />
        <path d="m4 6 .5.5L6 5" />
        <path d="m4 12 .5.5L6 11" />
        <path d="m4 18 .5.5L6 17" />
      </svg>
    );
  }

  if (kind === "S") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M5 8.5 12 5l7 3.5-7 3.5-7-3.5Z" />
        <path d="M5 13.5 12 17l7-3.5" />
        <path d="M5 17.5 12 21l7-3.5" />
      </svg>
    );
  }

  if (kind === "A") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M4 19h16" />
        <path d="M7 19V9" />
        <path d="M12 19V5" />
        <path d="M17 19v-7" />
      </svg>
    );
  }

  if (kind === "P") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M16 11V8a4 4 0 0 0-8 0v3" />
        <path d="M6 11h12v9H6z" />
        <path d="M12 15v2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...common}>
      <path d="M5 5h14v14H5z" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
    </svg>
  );
}

export function SidebarNav({
  adminItems,
  brands,
  navItems,
  user,
  logoutAction,
}: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const roleLabel = user ? user.role.replaceAll("_", " ") : "Sign in required";
  const uploadBrandSlug = pathname === "/uploads/new" ? searchParams.get("brand") : null;

  const currentWorkspace = useMemo(() => {
    return (
      brands.find((brand) => brand.slug === uploadBrandSlug) ??
      brands.find((brand) => pathname.startsWith(`/brands/${brand.slug}`)) ??
      brands.find((brand) => brand.id === user?.primaryBrandId) ??
      brands[0]
    );
  }, [brands, pathname, uploadBrandSlug, user?.primaryBrandId]);

  const isActive = (href: string) => {
    const baseHref = href.split("?")[0] ?? href;

    if (baseHref === "/") {
      return pathname === "/";
    }

    return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
  };

  const getNavHref = (item: NavItem) => {
    if (item.href !== "/uploads/new") {
      return item.href;
    }

    if (pathname === "/shared" || uploadBrandSlug === "shared") {
      return "/uploads/new?brand=shared";
    }

    if (!currentWorkspace) {
      return item.href;
    }

    return `/uploads/new?brand=${encodeURIComponent(currentWorkspace.slug)}`;
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-topbar">
        <Link className="brand-lockup" href="/" title="ACAMS Library">
          <span className="brand-badge">A</span>
          <span className="brand-copy">
            <strong>ACAMS</strong>
            <small>Brand control layer</small>
          </span>
        </Link>
        <button
          aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          aria-pressed={isCollapsed}
          className="sidebar-toggle"
          onClick={() => setIsCollapsed((value) => !value)}
          type="button"
        >
          <span aria-hidden="true">{isCollapsed ? ">" : "<"}</span>
        </button>
      </div>

      <nav className="nav-group" aria-label="Primary">
        {navItems.map((item) => (
          <Link
            className={`nav-link ${isActive(getNavHref(item)) ? "nav-link-active" : ""}`}
            href={getNavHref(item)}
            key={item.href}
            title={item.label}
          >
            <span className="nav-link-main">
              <span className="nav-icon" aria-hidden="true">
                <NavIcon kind={item.icon} />
              </span>
              <span className="nav-text">{item.label}</span>
            </span>
            {typeof item.count === "number" ? <span className="nav-pill">{item.count}</span> : null}
          </Link>
        ))}
      </nav>

      {adminItems.length ? (
        <nav className="nav-group nav-group-tight" aria-label="Admin">
          <p className="nav-label">Admin</p>
          {adminItems.map((item) => (
            <Link
              className={`nav-link nav-link-subtle ${isActive(item.href) ? "nav-link-active" : ""}`}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <span className="nav-link-main">
                <span className="nav-icon" aria-hidden="true">
                  <NavIcon kind={item.icon} />
                </span>
                <span className="nav-text">{item.label}</span>
              </span>
            </Link>
          ))}
        </nav>
      ) : null}

      <section className="workspace-switcher" aria-label="Workspace switcher">
        <p className="nav-label">Workspaces</p>
        {currentWorkspace ? (
          <Link
            className={`workspace-current ${
              pathname.startsWith(`/brands/${currentWorkspace.slug}`) || uploadBrandSlug === currentWorkspace.slug
                ? "workspace-current-active"
                : ""
            }`}
            href={`/brands/${currentWorkspace.slug}`}
            title={currentWorkspace.name}
          >
            <span className="workspace-avatar" aria-hidden="true">
              {currentWorkspace.name.replace("Astral ", "").slice(0, 1)}
            </span>
            <span className="workspace-copy">
              <strong>{currentWorkspace.name}</strong>
              <small>{currentWorkspace.businessUnit}</small>
            </span>
          </Link>
        ) : null}
        <div className="workspace-list-nav">
          {brands
            .filter((brand) => brand.id !== currentWorkspace?.id)
            .map((brand) => (
              <Link
                className={`workspace-link-nav ${
                  pathname.startsWith(`/brands/${brand.slug}`) || uploadBrandSlug === brand.slug
                    ? "workspace-link-nav-active"
                    : ""
                }`}
                href={`/brands/${brand.slug}`}
                key={brand.id}
                title={brand.name}
              >
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
  );
}
