import { sql } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const officeId = String(body.officeId ?? "").trim();

    if (!officeId) {
      return Response.json({ error: "Office is required" }, { status: 400 });
    }

    const alreadyCalled = await sql`
      SELECT id
      FROM queue_entries
      WHERE office_id = ${officeId}
        AND status = 'called'
      LIMIT 1
    `;

    if (alreadyCalled.length > 0) {
      return Response.json(
        { error: "Mark the current student as served before calling the next one" },
        { status: 409 }
      );
    }

    const nextStudent = await sql`
      UPDATE queue_entries
      SET status = 'called', called_at = now()
      WHERE id = (
        SELECT id
        FROM queue_entries
        WHERE office_id = ${officeId}
          AND status = 'waiting'
        ORDER BY joined_at ASC
        LIMIT 1
      )
      RETURNING id, student_name, student_id, queue_number, status, joined_at, called_at
    `;

    if (nextStudent.length === 0) {
      return Response.json({ error: "No students are waiting" }, { status: 404 });
    }

    return Response.json(nextStudent[0]);
  } catch (error) {
    console.error("Failed to call next student:", error);
    return Response.json({ error: "Unable to call next student" }, { status: 500 });
  }
}
