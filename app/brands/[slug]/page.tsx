import { notFound } from "next/navigation";
import { AssetLibrary } from "@/components/asset-library";
import { DashboardHeader } from "@/components/dashboard-header";
import { getBrandBySlug, getVisibleAssetsForBrand, userCanAccessBrand } from "@/lib/acams";
import { requireUser } from "@/lib/auth";

type BrandPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const user = await requireUser();
  const brand = await getBrandBySlug(slug);

  if (!brand || !userCanAccessBrand(user, brand.id)) {
    notFound();
  }

  const visibleAssets = await getVisibleAssetsForBrand(user, brand.id);

  return (
    <main className="page">
      <DashboardHeader
        eyebrow={brand.businessUnit}
        title={brand.name}
        description={brand.description}
      />

      <section className="panel stack">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Assets</p>
            <h2>{brand.name}</h2>
          </div>
        </div>
        <AssetLibrary
          assets={visibleAssets}
          emptyState="No assets found for this brand."
        />
      </section>
    </main>
  );
}
