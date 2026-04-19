"use client";

import { useMemo, useState } from "react";
import { AssetList } from "@/components/asset-list";
import type { AssetRecord } from "@/lib/types";

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

export function AssetLibrary({
  assets,
  emptyState,
}: {
  assets: AssetRecord[];
  emptyState: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [product, setProduct] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("Newest");

  const categories = useMemo(() => ["All", ...uniqueValues(assets.map((asset) => asset.category))], [assets]);
  const products = useMemo(() => ["All", ...uniqueValues(assets.map((asset) => asset.productName))], [assets]);
  const platforms = useMemo(
    () => ["All", ...uniqueValues(assets.map((asset) => asset.platform || "Internal"))],
    [assets],
  );
  const statuses = useMemo(
    () => ["All", ...uniqueValues(assets.map((asset) => asset.status.replaceAll("_", " ")))],
    [assets],
  );

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = assets.filter((asset) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          asset.title,
          asset.description ?? "",
          asset.brandName,
          asset.category,
          asset.platform ?? "Internal",
          asset.campaignName ?? "",
          asset.productName ?? "",
          ...asset.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesCategory = category === "All" || asset.category === category;
      const matchesProduct = product === "All" || (asset.productName ?? "") === product;
      const matchesPlatform = platform === "All" || (asset.platform ?? "Internal") === platform;
      const matchesStatus = status === "All" || asset.status.replaceAll("_", " ") === status;

      return matchesQuery && matchesCategory && matchesProduct && matchesPlatform && matchesStatus;
    });

    return filtered.sort((left, right) => {
      if (sort === "Oldest") {
        return left.createdAt.localeCompare(right.createdAt);
      }

      if (sort === "A-Z") {
        return left.title.localeCompare(right.title);
      }

      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [assets, category, platform, product, query, sort, status]);

  return (
    <div className="library-stack">
      <div className="library-toolbar">
        <label className="field library-field">
          <span>Search</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by asset, campaign, product or tag"
            value={query}
          />
        </label>

        <label className="field library-select">
          <span>Category</span>
          <select onChange={(event) => setCategory(event.target.value)} value={category}>
            {categories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field library-select">
          <span>Product</span>
          <select onChange={(event) => setProduct(event.target.value)} value={product}>
            {products.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field library-select">
          <span>Platform</span>
          <select onChange={(event) => setPlatform(event.target.value)} value={platform}>
            {platforms.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field library-select">
          <span>Status</span>
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            {statuses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="field library-select">
          <span>Sort</span>
          <select onChange={(event) => setSort(event.target.value)} value={sort}>
            {["Newest", "Oldest", "A-Z"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="library-summary">
        <span className="route-pill route-pill-1">{filteredAssets.length} shown</span>
        {query ? <span className="route-pill route-pill-0">Search: {query}</span> : null}
        {product !== "All" ? <span className="route-pill route-pill-2">Product: {product}</span> : null}
        {status !== "All" ? <span className="route-pill route-pill-3">Status: {status}</span> : null}
      </div>

      <AssetList assets={filteredAssets} emptyState={emptyState} />
    </div>
  );
}
