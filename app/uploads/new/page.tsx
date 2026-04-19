import Link from "next/link";
import { createAssetAction } from "@/app/actions/asset-actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { UploadRequestBuilder } from "@/components/upload-request-builder";
import { getManageableBrandsForUser } from "@/lib/acams";
import { requireUser } from "@/lib/auth";

type UploadPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const user = await requireUser();
  const availableBrands = await getManageableBrandsForUser(user);
  const params = await searchParams;

  return (
    <main className="page">
      <DashboardHeader
        eyebrow="Upload"
        title="Add a new asset"
        description="Choose the brand, add the file, and save."
        actions={
          <Link className="button button-secondary" href="/">
            Back
          </Link>
        }
      />

      {params.error ? <p className="form-error">{params.error}</p> : null}
      {params.message ? <p className="form-message">{params.message}</p> : null}

      <UploadRequestBuilder
        action={createAssetAction}
        availableBrands={availableBrands}
        canUploadShared={user.role === "super_admin"}
      />
    </main>
  );
}
