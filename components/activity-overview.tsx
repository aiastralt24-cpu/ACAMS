import type { ActivityReport } from "@/lib/types";

export function ActivityOverview({ report }: { report: ActivityReport }) {
  return (
    <div className="activity-overview-grid">
      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">Uploads</p>
          <p className="stat-value">{report.uploads}</p>
          <p className="stat-detail">New assets</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Approvals</p>
          <p className="stat-value">{report.approvals}</p>
          <p className="stat-detail">Review updates</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Downloads</p>
          <p className="stat-value">{report.downloads}</p>
          <p className="stat-detail">Files downloaded</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Access changes</p>
          <p className="stat-value">{report.grants}</p>
          <p className="stat-detail">Permissions updated</p>
        </article>
      </section>

      <section className="panel stack report-grid">
        <article className="summary-block">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Summary</p>
              <h2>Updates by type</h2>
            </div>
          </div>
          <div className="summary-list">
            {report.eventMix.map((item) => (
              <div className="summary-row" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.count} events</span>
              </div>
            ))}
          </div>
        </article>

        <article className="summary-block">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Brands</p>
              <h2>Most active brands</h2>
            </div>
          </div>
          <div className="summary-list">
            {report.topBrands.length ? (
              report.topBrands.map((brand) => (
                <div className="summary-row" key={brand.label}>
                  <strong>{brand.label}</strong>
                  <span>{brand.count} actions</span>
                </div>
              ))
            ) : (
              <p className="empty-state">No activity yet.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
