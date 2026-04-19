import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { BrandWorkspaceGrid } from "@/components/brand-workspace-grid";
import { StatCard } from "@/components/stat-card";
import { AssetList } from "@/components/asset-list";
import { getDashboardData, getVisibleBrandsForUser } from "@/lib/acams";
import { requireUser } from "@/lib/auth";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const [dashboard, brands, params] = await Promise.all([
    getDashboardData(user),
    getVisibleBrandsForUser(user),
    searchParams,
  ]);
  const canReview = user.role === "super_admin" || user.role === "brand_admin";
  const primaryBrand = brands.find((brand) => brand.id === user.primaryBrandId) ?? brands[0];

  return (
    <main className="page">
      <DashboardHeader
        eyebrow="Brand library"
        title="Find the right asset faster"
        description="Browse approved files, add new work, and keep brand content in one place."
        actions={
          <>
            <Link className="button button-primary" href="/uploads/new">
              Add asset
            </Link>
            <Link className="button button-secondary" href="/shared">
              Shared library
            </Link>
            {canReview ? (
              <Link className="button button-secondary" href="/approvals">
                Review uploads
              </Link>
            ) : null}
          </>
        }
      />

      {params.message ? <p className="form-message">{params.message}</p> : null}

      <section className="stats-grid">
        <StatCard
          label="Ready to use"
          value={dashboard.approvedCount.toString()}
          detail="Approved assets"
        />
        <StatCard
          label="Needs review"
          value={dashboard.pendingCount.toString()}
          detail={canReview ? "Waiting for you" : "With reviewers"}
        />
        <StatCard
          label="Brands"
          value={dashboard.brandsCount.toString()}
          detail="Organized libraries"
        />
        <StatCard
          label="Shared"
          value={dashboard.sharedAssetsCount.toString()}
          detail="Reusable files"
        />
      </section>

      <section className="action-strip">
        <article className="action-card action-card-primary">
          <p className="panel-eyebrow">Start here</p>
          <h2>{primaryBrand ? primaryBrand.name : "Brand workspace"}</h2>
          <p>Open your main library and continue from the latest approved files.</p>
          {primaryBrand ? (
            <Link className="button button-primary" href={`/brands/${primaryBrand.slug}`}>
              Open brand
            </Link>
          ) : null}
        </article>

        <article className="action-card">
          <p className="panel-eyebrow">Next action</p>
          <h2>{dashboard.pendingCount && canReview ? "Review pending uploads" : "Add approved work"}</h2>
          <p>
            {dashboard.pendingCount && canReview
              ? "Keep the library clean by approving or rejecting new files."
              : "Upload final creative with the right brand, product, and platform."}
          </p>
          <Link className="button button-secondary" href={dashboard.pendingCount && canReview ? "/approvals" : "/uploads/new"}>
            {dashboard.pendingCount && canReview ? "Review now" : "Add asset"}
          </Link>
        </article>
      </section>

      <section className="two-column">
        <div className="panel stack">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Recent</p>
              <h2>Latest assets</h2>
            </div>
            <Link className="workspace-link" href="/shared">
              View all
            </Link>
          </div>
          <AssetList
            assets={dashboard.latestAssets}
            emptyState="No assets yet. Add the first approved file."
          />
        </div>

        <div className="panel stack">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Brands</p>
              <h2>Workspaces</h2>
            </div>
          </div>
          <BrandWorkspaceGrid brands={brands.slice(0, 6)} compact />
        </div>
      </section>
    </main>
  );
}
