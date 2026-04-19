import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { ActivityFeed } from "@/components/activity-feed";
import { ActivityOverview } from "@/components/activity-overview";
import { getActivityReport, getAuditEvents } from "@/lib/acams";
import { requireUser } from "@/lib/auth";

export default async function ActivityPage() {
  const user = await requireUser();
  const [events, report] = await Promise.all([getAuditEvents(user), getActivityReport(user)]);

  return (
    <main className="page">
      <DashboardHeader
        eyebrow="Activity"
        title="Activity"
        description="See what changed across the asset library."
        actions={
          <Link className="button button-secondary" href="/api/activity/export">
            Export CSV
          </Link>
        }
      />

      <ActivityOverview report={report} />

      <section className="panel stack">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Recent</p>
            <h2>Latest updates</h2>
          </div>
        </div>
        <ActivityFeed items={events} />
      </section>
    </main>
  );
}
