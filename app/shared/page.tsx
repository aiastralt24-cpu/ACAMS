import { AssetLibrary } from "@/components/asset-library";
import { DashboardHeader } from "@/components/dashboard-header";
import { getSharedAssets } from "@/lib/acams";
import { requireUser } from "@/lib/auth";

export default async function SharedPage() {
  const user = await requireUser();
  const sharedAssets = await getSharedAssets(user);

  return (
    <main className="page">
      <DashboardHeader
        eyebrow="Shared library"
        title="Common assets"
        description="Topical, corporate, and reusable creative for all brands."
      />

      <section className="panel stack">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Shared</p>
            <h2>Shared assets</h2>
          </div>
        </div>
        <AssetLibrary
          assets={sharedAssets}
          emptyState="No shared assets found."
        />
      </section>
    </main>
  );
}
