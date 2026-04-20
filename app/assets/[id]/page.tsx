import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveAssetAction, deleteAssetAction } from "@/app/actions/asset-actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { DeleteAssetForm } from "@/components/delete-asset-form";
import { getAssetDetail } from "@/lib/acams";
import { requireUser } from "@/lib/auth";

type AssetDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getAssetDetail(user, id);

  if (!detail) {
    notFound();
  }

  const { asset, history } = detail;

  return (
    <main className="page">
      <DashboardHeader
        eyebrow={asset.brandName}
        title={asset.title}
        description={asset.description ?? "Asset details and download."}
        actions={
          <>
            <Link className="button button-secondary" href={asset.brandSlug ? `/brands/${asset.brandSlug}` : "/shared"}>
              Back
            </Link>
            <a className="button button-primary" href={`/api/assets/${asset.id}/download`}>
              Download
            </a>
            {user.role === "super_admin" ? (
              <DeleteAssetForm
                action={deleteAssetAction}
                archiveAction={archiveAssetAction}
                assetId={asset.id}
                assetTitle={asset.title}
              />
            ) : null}
          </>
        }
      />

      <section className="asset-detail-grid">
        <article className="panel stack">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Details</p>
              <h2>Asset information</h2>
            </div>
          </div>
          <div className="detail-list">
            <div className="detail-row"><span>Brand</span><strong>{asset.brandName}</strong></div>
            <div className="detail-row"><span>Type</span><strong>{asset.category}</strong></div>
            <div className="detail-row"><span>Platform</span><strong>{asset.platform || "Internal"}</strong></div>
            <div className="detail-row"><span>Product</span><strong>{asset.productName || "General"}</strong></div>
            <div className="detail-row"><span>Campaign</span><strong>{asset.campaignName || "General"}</strong></div>
            <div className="detail-row"><span>Version</span><strong>{asset.versionLabel}</strong></div>
            <div className="detail-row"><span>Status</span><strong>{asset.status.replaceAll("_", " ")}</strong></div>
            <div className="detail-row"><span>Uploaded by</span><strong>{asset.uploadedByName}</strong></div>
          </div>
          <div className="tag-row">
            {asset.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </article>

        <article className="panel stack">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">History</p>
              <h2>Recent changes</h2>
            </div>
          </div>
          <div className="history-list">
            {history.length ? (
              history.map((entry) => (
                <div className="history-row" key={entry.id}>
                  <p className="history-type">{entry.type}</p>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                </div>
              ))
            ) : (
              <p className="empty-state">No history recorded yet.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
