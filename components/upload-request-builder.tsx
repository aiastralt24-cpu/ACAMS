"use client";

import { useEffect, useMemo, useState } from "react";
import { assetTypeOptions, brandCatalog, platformOptions, versionOptions } from "@/lib/brand-catalog";
import type { BrandRecord } from "@/lib/types";

type UploadRequestBuilderProps = {
  availableBrands: BrandRecord[];
  canUploadShared: boolean;
  initialBrandId?: string;
  action: (formData: FormData) => Promise<void>;
};

type ChipOption = {
  label: string;
  value: string;
  tone?: string;
};

function GuidedChip({
  checked,
  group,
  onChange,
  option,
  tone = "active",
}: {
  checked: boolean;
  group: string;
  onChange: (value: string) => void;
  option: ChipOption;
  tone?: string;
}) {
  return (
    <label className={`guided-chip guided-chip-${tone} ${checked ? "guided-chip-selected" : ""}`}>
      <input
        checked={checked}
        name={group}
        onChange={() => onChange(option.value)}
        type="radio"
        value={option.value}
      />
      <span>{option.label}</span>
    </label>
  );
}

export function UploadRequestBuilder({
  availableBrands,
  canUploadShared,
  initialBrandId,
  action,
}: UploadRequestBuilderProps) {
  const initialBrandIsAllowed =
    Boolean(initialBrandId) &&
    (availableBrands.some((brand) => brand.id === initialBrandId) ||
      (canUploadShared && initialBrandId === "shared"));
  const firstBrandId = initialBrandIsAllowed ? initialBrandId ?? "" : availableBrands[0]?.id ?? "";
  const [selectedBrandId, setSelectedBrandId] = useState(firstBrandId);
  const [appliedInitialBrandId, setAppliedInitialBrandId] = useState(firstBrandId);
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");
  const [selectedAssetType, setSelectedAssetType] = useState("Social Post");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("v1");

  const visibleBrandCatalog = useMemo(() => {
    const lookup = new Set(availableBrands.map((brand) => brand.id));
    return brandCatalog.filter((brand) => lookup.has(brand.id));
  }, [availableBrands]);

  useEffect(() => {
    if (firstBrandId && appliedInitialBrandId !== firstBrandId) {
      setSelectedBrandId(firstBrandId);
      setAppliedInitialBrandId(firstBrandId);
      setSelectedProduct("");
      setProductQuery("");
      return;
    }

    if (!selectedBrandId && firstBrandId) {
      setSelectedBrandId(firstBrandId);
      return;
    }

    if (
      selectedBrandId &&
      selectedBrandId !== "shared" &&
      !availableBrands.some((brand) => brand.id === selectedBrandId)
    ) {
      setSelectedBrandId(firstBrandId);
      setSelectedProduct("");
      setProductQuery("");
    }
  }, [appliedInitialBrandId, availableBrands, firstBrandId, selectedBrandId]);

  const currentBrand = useMemo(() => {
    return brandCatalog.find((brand) => brand.id === selectedBrandId);
  }, [selectedBrandId]);

  const currentRoute = [currentBrand?.name, selectedProduct || null, selectedPlatform, selectedAssetType].filter(
    Boolean,
  ) as string[];
  const selectedBrandLabel = selectedBrandId === "shared" ? "Shared Library" : currentBrand?.name ?? "";
  const filteredProducts = useMemo(() => {
    const products = currentBrand?.products ?? [];
    const query = productQuery.trim().toLowerCase();

    if (!query) {
      return products.slice(0, 18);
    }

    return products.filter((product) => product.toLowerCase().includes(query)).slice(0, 24);
  }, [currentBrand, productQuery]);
  const brandOptions: ChipOption[] = [
    ...visibleBrandCatalog.map((brand) => ({
      label: brand.name,
      value: brand.id,
      tone: brand.accent,
    })),
    ...(canUploadShared ? [{ label: "Shared Library", value: "shared", tone: "shared" }] : []),
  ];
  const hasSingleBrandOption = brandOptions.length === 1;

  return (
    <form action={action} className="request-builder">
      <input name="brandId" type="hidden" value={selectedBrandId} />
      <input name="brandLabel" type="hidden" value={selectedBrandLabel} />
      <input name="platform" type="hidden" value={selectedPlatform} />
      <input name="category" type="hidden" value={selectedAssetType} />
      <input name="productName" type="hidden" value={selectedProduct} />
      <input name="versionLabel" type="hidden" value={selectedVersion} />
      <input
        name="tags"
        type="hidden"
        value={[selectedBrandId, selectedProduct, selectedPlatform, selectedAssetType]
          .filter(Boolean)
          .join(",")}
      />

      <div className="request-shell">
        <div className="request-shell-top">
          <div>
            <h2>New asset</h2>
            <p>Add the file with a few quick choices.</p>
          </div>
          <span className="request-badge">UPLOAD</span>
        </div>

        <div className="request-progress">
          <span className="request-progress-active" />
          <span />
        </div>

        <div className="request-body">
          <div className="selector-section">
              <div className="selector-head">
                <h3>What needs to happen?</h3>
              </div>
            <label className="field field-inline">
              <input name="title" placeholder="Describe the asset in one line" required />
            </label>
          </div>

          <div className="request-grid">
            <section className="request-card">
              <div className="selector-head">
                <h3>Brand</h3>
              </div>
              {hasSingleBrandOption ? (
                <div className="selected-destination">
                  <span>Destination</span>
                  <strong>{brandOptions[0]?.label}</strong>
                </div>
              ) : (
                <div className="chip-grid">
                  {brandOptions.map((brand) => (
                    <GuidedChip
                      checked={selectedBrandId === brand.value}
                      group="brandChoice"
                      key={brand.value}
                      onChange={(value) => {
                        setSelectedBrandId(value);
                        setSelectedProduct("");
                        setProductQuery("");
                      }}
                      option={brand}
                      tone={brand.tone}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="request-card">
              <div className="selector-head">
                <h3>Platform</h3>
              </div>
              <div className="chip-grid">
                {platformOptions.map((platform) => (
                  <GuidedChip
                    checked={selectedPlatform === platform}
                    group="platformChoice"
                    key={platform}
                    onChange={setSelectedPlatform}
                    option={{ label: platform, value: platform }}
                    tone="dark"
                  />
                ))}
              </div>
            </section>

            <section className="request-card">
              <div className="selector-head">
                <h3>Content type</h3>
              </div>
              <div className="chip-grid">
                {assetTypeOptions.map((assetType) => (
                  <GuidedChip
                    checked={selectedAssetType === assetType}
                    group="assetTypeChoice"
                    key={assetType}
                    onChange={setSelectedAssetType}
                    option={{ label: assetType, value: assetType }}
                    tone="accent"
                  />
                ))}
              </div>
            </section>
          </div>

          {selectedBrandId !== "shared" && currentBrand ? (
            <section className="selector-section">
              <div className="selector-head">
                <h3>Product</h3>
                <p>{currentBrand.prompt}</p>
              </div>
              {currentBrand.products.length > 18 ? (
                <label className="field product-search">
                  <span>Search product</span>
                  <input
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Type product name"
                    value={productQuery}
                  />
                </label>
              ) : null}
              <div className="chip-grid">
                {filteredProducts.map((product) => (
                  <GuidedChip
                    checked={selectedProduct === product}
                    group="productChoice"
                    key={product}
                    onChange={setSelectedProduct}
                    option={{ label: product, value: product }}
                  />
                ))}
              </div>
              {currentBrand.products.length > filteredProducts.length ? (
                <p className="selector-hint">
                  Showing {filteredProducts.length} of {currentBrand.products.length}. Type to narrow the list.
                </p>
              ) : null}
            </section>
          ) : null}

          <div className="request-footer-grid">
            <section className="request-card request-card-compact">
              <div className="selector-head">
                <h3>Version</h3>
              </div>
              <div className="chip-row">
                {versionOptions.map((version) => (
                  <GuidedChip
                    checked={selectedVersion === version}
                    group="versionChoice"
                    key={version}
                    onChange={setSelectedVersion}
                    option={{ label: version, value: version }}
                  />
                ))}
              </div>
            </section>

            <label className="field request-card request-card-compact">
              <span>Campaign or note</span>
              <input name="campaignName" placeholder="Optional campaign name" />
            </label>
          </div>

          <label className="field request-card">
            <span>Creative file</span>
            <input name="file" type="file" required />
          </label>

          <div className="current-route">
            <p>Selected</p>
            <div className="chip-row">
              {currentRoute.map((item, index) => (
                <span className={`route-pill route-pill-${index}`} key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="request-submit">
            <button className="button button-primary" type="submit">
              Save asset
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
