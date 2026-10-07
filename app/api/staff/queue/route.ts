import { sql } from "@/lib/db";
import { requireStaff } from "@/lib/staff-auth";

export async function GET(request: Request) {
  try {
    const unauthorized = await requireStaff();
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(request.url);
    const officeId = String(searchParams.get("officeId") ?? "").trim();
    if (!officeId) return Response.json({ error: "Office is required" }, { status: 400 });

    const office = await sql`SELECT id, name FROM offices WHERE id = ${officeId} AND is_active = true LIMIT 1`;
    if (office.length === 0) return Response.json({ error: "Office not found" }, { status: 404 });

    const called = await sql`
      SELECT id, student_name, student_id, queue_number, status, joined_at, called_at
      FROM queue_entries WHERE office_id = ${officeId} AND status = 'called'
      ORDER BY called_at ASC LIMIT 1
    `;
    const waiting = await sql`
      SELECT id, student_name, student_id, queue_number, status, joined_at
      FROM queue_entries WHERE office_id = ${officeId} AND status = 'waiting'
      ORDER BY joined_at ASC
    `;
    return Response.json({ office: office[0], called: called[0] ?? null, waiting, waitingCount: waiting.length });
  } catch (error) {
    console.error("Failed to load staff queue:", error);
    return Response.json({ error: "Unable to load queue" }, { status: 500 });
  }
}
