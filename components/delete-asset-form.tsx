"use client";

type DeleteAssetFormProps = {
  action: (formData: FormData) => Promise<void>;
  assetId: string;
  assetTitle: string;
};

export function DeleteAssetForm({ action, assetId, assetTitle }: DeleteAssetFormProps) {
  return (
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
  );
}
