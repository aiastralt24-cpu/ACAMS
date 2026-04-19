import { NextResponse } from "next/server";
import { getAuditEvents } from "@/lib/acams";
import { getCurrentUser } from "@/lib/auth";

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await getAuditEvents(user);
  const header = ["id", "type", "title", "summary", "actor", "brand", "entity_title", "created_at"];
  const rows = events.map((event) =>
    [
      event.id,
      event.eventType,
      event.title,
      event.summary,
      event.actorName ?? "",
      event.brandName ?? "",
      event.entityTitle ?? "",
      event.createdAt,
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="acams-activity.csv"',
    },
  });
}
