import { sql } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await sql`
      SELECT
        q.id,
        q.student_name,
        q.student_id,
        q.office_id,
        q.queue_number,
        q.status,
        q.joined_at,
        q.called_at,
        o.name AS office_name
      FROM queue_entries q
      JOIN offices o ON o.id = q.office_id
      WHERE q.id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json({ error: "Queue entry not found" }, { status: 404 });
    }

    const entry = rows[0];
    let position = 0;

    if (entry.status === "waiting") {
      const positionResult = await sql`
        SELECT COUNT(*)::int AS position
        FROM queue_entries
        WHERE office_id = ${entry.office_id}
          AND status = 'waiting'
          AND joined_at <= ${entry.joined_at}
      `;

      position = positionResult[0].position;
    }

    return Response.json({
      id: entry.id,
      studentName: entry.student_name,
      studentId: entry.student_id,
      officeId: entry.office_id,
      officeName: entry.office_name,
      queueNumber: entry.queue_number,
      status: entry.status,
      position,
      joinedAt: entry.joined_at,
      calledAt: entry.called_at,
    });
  } catch (error) {
    console.error("Failed to track queue entry:", error);
    return Response.json({ error: "Unable to load queue status" }, { status: 500 });
  }
}
