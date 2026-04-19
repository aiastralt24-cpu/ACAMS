import Link from "next/link";
import type { BrandRecord } from "@/lib/types";

export function BrandWorkspaceGrid({
  brands,
  compact = false,
}: {
  brands: BrandRecord[];
  compact?: boolean;
}) {
  return (
    <section className={compact ? "workspace-list" : "workspace-grid"}>
      {brands.map((brand) => (
        <Link className={compact ? "workspace-row" : "workspace-card"} href={`/brands/${brand.slug}`} key={brand.id}>
          <p className="workspace-kicker">{brand.businessUnit}</p>
          <h3>{brand.name}</h3>
          {!compact ? <p>{brand.description}</p> : null}
          <span className="workspace-link">{compact ? "Open" : "Open brand"}</span>
        </Link>
      ))}
    </section>
  );
}
