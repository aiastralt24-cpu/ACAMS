import type { AuditEvent } from "@/lib/types";

export function ActivityFeed({ items }: { items: AuditEvent[] }) {
  return (
    <div className="activity-list">
      {items.map((event) => (
        <article className="activity-row" key={event.id}>
          <header>
            <h3>{event.title}</h3>
            <span className="tag">{event.eventType}</span>
          </header>
          <p className="activity-meta">{event.summary}</p>
          <p className="activity-meta">
            {[event.actorName, event.brandName, event.entityTitle]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="activity-meta">
            {new Intl.DateTimeFormat("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(event.createdAt))}
          </p>
        </article>
      ))}
    </div>
  );
}
