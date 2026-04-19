import Link from "next/link";
import type { AssetRecord } from "@/lib/types";

function getPreviewTone(asset: AssetRecord) {
  if (asset.isShared) {
    return "shared";
  }

  if (asset.brandSlug?.includes("pipes")) {
    return "pipes";
  }

  if (asset.brandSlug?.includes("adhesives")) {
    return "adhesives";
  }

  if (asset.brandSlug?.includes("bathware")) {
    return "bathware";
  }

  if (asset.brandSlug?.includes("paints")) {
    return "paints";
  }

  return "corporate";
}

function AssetPreview({ asset }: { asset: AssetRecord }) {
  const label = asset.fileType.slice(0, 3).toUpperCase();

  return (
    <Link
      aria-label={`Open ${asset.title}`}
      className={`asset-preview asset-preview-${getPreviewTone(asset)}`}
      href={`/assets/${asset.id}`}
    >
      {asset.thumbnailUrl ? (
        <img alt={asset.title} src={asset.thumbnailUrl} />
      ) : (
        <span className="asset-preview-copy">
          <span className="asset-preview-mark">{label}</span>
          <strong>{asset.title}</strong>
          <small>{asset.category} · {asset.platform || "Internal"}</small>
        </span>
      )}
    </Link>
  );
}

export function AssetList({
  assets,
  emptyState,
}: {
  assets: AssetRecord[];
  emptyState: string;
}) {
  if (!assets.length) {
    return <p className="empty-state">{emptyState}</p>;
  }

  return (
    <div className="asset-list">
      {assets.map((asset) => (
        <article className="asset-row" key={asset.id}>
          <AssetPreview asset={asset} />
          <header>
            <div>
              <h3>
                <Link className="asset-link" href={`/assets/${asset.id}`}>
                  {asset.title}
                </Link>
              </h3>
              <p className="asset-meta">
                {asset.brandName} · {asset.category} · {asset.fileType.toUpperCase()}
              </p>
            </div>
            <span className={`status status-${asset.status}`}>{asset.status.replaceAll("_", " ")}</span>
          </header>
          {asset.description ? <p className="asset-meta">{asset.description}</p> : null}
          <p className="asset-meta">
            {asset.campaignName || "General"} · {asset.versionLabel} · {asset.platform || "Internal"}
          </p>
          <div className="tag-row">
            {asset.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
