import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentName = String(body.studentName ?? "").trim();
    const studentId = String(body.studentId ?? "").trim();
    const officeId = String(body.officeId ?? "").trim();

    if (!studentName || !studentId || !officeId) {
      return Response.json({ error: "Name, student ID and office are required" }, { status: 400 });
    }

    const office = await sql`
      SELECT id, name, opens_at, closes_at, timezone, average_service_minutes,
        (now() AT TIME ZONE timezone)::time >= opens_at
        AND (now() AT TIME ZONE timezone)::time < closes_at AS is_open
      FROM offices WHERE id = ${officeId} AND is_active = true LIMIT 1
    `;
    if (office.length === 0) return Response.json({ error: "Selected office is unavailable" }, { status: 404 });
    if (!office[0].is_open) {
      return Response.json({ error: `This office is closed. Hours: ${String(office[0].opens_at).slice(0,5)}–${String(office[0].closes_at).slice(0,5)}.` }, { status: 409 });
    }

    const existingEntry = await sql`
      SELECT q.id, q.queue_number, q.status, o.name AS office_name
      FROM queue_entries q JOIN offices o ON o.id = q.office_id
      WHERE lower(q.student_id) = lower(${studentId}) AND q.status IN ('waiting', 'called')
      ORDER BY q.joined_at DESC LIMIT 1
    `;
    if (existingEntry.length > 0) {
      const active = existingEntry[0];
      return Response.json({ error: `You already have an active queue at ${active.office_name}. Complete or leave that queue before joining another one.`, activeQueue: { id: active.id, officeName: active.office_name, queueNumber: active.queue_number, status: active.status } }, { status: 409 });
    }

    // Retry once if simultaneous joins race for the same daily queue number.
    let inserted: Awaited<ReturnType<typeof sql>> | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        inserted = await sql`
          INSERT INTO queue_entries (student_name, student_id, office_id, queue_number, status)
          VALUES (
            ${studentName}, ${studentId}, ${officeId},
            (SELECT COALESCE(MAX(queue_number), 0) + 1 FROM queue_entries
             WHERE office_id = ${officeId}
               AND (joined_at AT TIME ZONE ${office[0].timezone})::date = (now() AT TIME ZONE ${office[0].timezone})::date),
            'waiting'
          )
          RETURNING id, queue_number, status, joined_at, student_token
        `;
        break;
      } catch (error) {
        if (attempt === 1) throw error;
      }
    }
    if (!inserted?.length) throw new Error("Queue entry was not created");
    const entry = inserted[0];

    const positionResult = await sql`SELECT COUNT(*)::int AS position FROM queue_entries WHERE office_id = ${officeId} AND status = 'waiting' AND joined_at::date = ${entry.joined_at}::date AND queue_number <= ${entry.queue_number}`;
    const position = Number(positionResult[0].position);
    const estimatedWaitMinutes = Math.max(position - 1, 0) * Number(office[0].average_service_minutes);

    return Response.json({ id: entry.id, studentName, studentId, officeId, officeName: office[0].name, queueNumber: entry.queue_number, status: entry.status, position, estimatedWaitMinutes, studentToken: entry.student_token, joinedAt: entry.joined_at }, { status: 201 });
  } catch (error) {
    console.error("Failed to join queue:", error);
    return Response.json({ error: "Unable to join the queue" }, { status: 500 });
  }
}
