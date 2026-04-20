"use client";

type DeleteAssetFormProps = {
  archiveAction: (formData: FormData) => Promise<void>;
  action: (formData: FormData) => Promise<void>;
  assetId: string;
  assetTitle: string;
};

export function DeleteAssetForm({ archiveAction, action, assetId, assetTitle }: DeleteAssetFormProps) {
  return (
    <div className="asset-admin-actions">
      <form
        action={archiveAction}
        onSubmit={(event) => {
          const confirmed = window.confirm(`Archive "${assetTitle}"? It will be hidden from normal browsing but kept for records.`);

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <input name="assetId" type="hidden" value={assetId} />
        <button className="button button-secondary" type="submit">
          Archive
        </button>
      </form>
      <form
        action={action}
        onSubmit={(event) => {
          const confirmed = window.confirm(`Delete "${assetTitle}" permanently? This cannot be undone.`);

          if (!confirmed) {
            event.preventDefault();
          }
        }}
      >
        <input name="assetId" type="hidden" value={assetId} />
        <button className="button button-danger" type="submit">
          Delete
        </button>
      </form>
    </div>
  );
}
