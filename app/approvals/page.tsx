import { reviewAssetAction } from "@/app/actions/asset-actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { getApprovalQueue } from "@/lib/acams";
import { requireUser } from "@/lib/auth";

type ApprovalPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ApprovalPage({ searchParams }: ApprovalPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const approvals = await getApprovalQueue(user);
  const agencyCount = approvals.filter((entry) => entry.uploadedByName.toLowerCase().includes("agency")).length;
  const workspaceCount = new Set(approvals.map((entry) => entry.brandName)).size;

  return (
    <main className="page">
      <DashboardHeader
        eyebrow="Review"
        title="Review uploads"
        description="Approve the right assets and reject the ones that need changes."
      />

      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Pending</p>
          <p className="stat-value">{approvals.length}</p>
          <p className="stat-detail">Waiting for review</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Brands</p>
          <p className="stat-value">{workspaceCount}</p>
          <p className="stat-detail">In this list</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Agency uploads</p>
          <p className="stat-value">{agencyCount}</p>
          <p className="stat-detail">Waiting for review</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Your role</p>
          <p className="stat-value approval-role">{user.role.replaceAll("_", " ")}</p>
          <p className="stat-detail">Signed in user</p>
        </article>
      </section>

      <section className="panel stack">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">List</p>
            <h2>Uploads to review</h2>
          </div>
        </div>

        {params.error ? <p className="form-error">{params.error}</p> : null}
        {params.message ? <p className="form-message">{params.message}</p> : null}

        <div className="approval-list">
          {approvals.length ? (
            approvals.map((entry) => (
              <article className="approval-card" key={entry.id}>
                <div className="approval-copy">
                  <h3>{entry.assetTitle}</h3>
                  <p>
                    {entry.brandName} · Uploaded by {entry.uploadedByName}
                  </p>
                  <p>
                    {[entry.category, entry.platform ?? "Internal", entry.versionLabel]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {entry.submittedAt ? (
                    <p>Submitted {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.submittedAt))}</p>
                  ) : null}
                  {entry.comment ? <p>{entry.comment}</p> : null}
                </div>
                <form action={reviewAssetAction} className="approval-form">
                  <input name="assetId" type="hidden" value={entry.assetId} />
                  <textarea name="comment" rows={3} placeholder="Add a note if needed" />
                  <div className="approval-actions">
                    <button className="button button-secondary" name="action" value="rejected" type="submit">
                      Reject
                    </button>
                    <button className="button button-primary" name="action" value="approved" type="submit">
                      Approve
                    </button>
                  </div>
                </form>
              </article>
            ))
          ) : (
            <p className="empty-state">Nothing to review right now.</p>
          )}
        </div>
      </section>
    </main>
  );
}
