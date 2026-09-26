import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const studentName = String(body.studentName ?? "").trim();
    const studentId = String(body.studentId ?? "").trim();
    const officeId = String(body.officeId ?? "").trim();

    if (!studentName || !studentId || !officeId) {
      return Response.json(
        { error: "Name, student ID and office are required" },
        { status: 400 }
      );
    }

    const office = await sql`
      SELECT id, name
      FROM offices
      WHERE id = ${officeId} AND is_active = true
      LIMIT 1
    `;

    if (office.length === 0) {
      return Response.json({ error: "Selected office is unavailable" }, { status: 404 });
    }

    const existingEntry = await sql`
      SELECT id
      FROM queue_entries
      WHERE office_id = ${officeId}
        AND lower(student_id) = lower(${studentId})
        AND status IN ('waiting', 'called')
      LIMIT 1
    `;

    if (existingEntry.length > 0) {
      return Response.json(
        { error: "You already have an active queue entry for this office." },
        { status: 409 }
      );
    }

    const inserted = await sql`
      INSERT INTO queue_entries (
        student_name,
        student_id,
        office_id,
        queue_number,
        status
      )
      VALUES (
        ${studentName},
        ${studentId},
        ${officeId},
        (
          SELECT COALESCE(MAX(queue_number), 0) + 1
          FROM queue_entries
          WHERE office_id = ${officeId}
        ),
        'waiting'
      )
      RETURNING id, queue_number, status, joined_at
    `;

    const entry = inserted[0];

    const positionResult = await sql`
      SELECT COUNT(*)::int AS position
      FROM queue_entries
      WHERE office_id = ${officeId}
        AND status = 'waiting'
        AND queue_number <= ${entry.queue_number}
    `;

    return Response.json(
      {
        id: entry.id,
        studentName,
        studentId,
        officeId,
        officeName: office[0].name,
        queueNumber: entry.queue_number,
        status: entry.status,
        position: positionResult[0].position,
        joinedAt: entry.joined_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to join queue:", error);
    return Response.json({ error: "Unable to join the queue" }, { status: 500 });
  }
}
