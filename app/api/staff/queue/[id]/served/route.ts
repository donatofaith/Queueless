import { sql } from "@/lib/db";
import { canAccessOffice, requireStaff } from "@/lib/staff-auth";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStaff();
    if ("response" in auth) return auth.response;
    const { session } = auth;
    const { id } = await params;

    const entry = await sql`SELECT office_id FROM queue_entries WHERE id = ${id} AND status = 'called' LIMIT 1`;
    if (entry.length === 0) return Response.json({ error: "Called student not found" }, { status: 404 });
    const officeId = String(entry[0].office_id);
    if (!canAccessOffice(session, officeId)) return Response.json({ error: "You are not authorized for this office" }, { status: 403 });

    const allowedOffice = await sql`SELECT id FROM offices WHERE id = ${officeId} AND school_id = ${session.schoolId} LIMIT 1`;
    if (allowedOffice.length === 0) return Response.json({ error: "Called student not found" }, { status: 404 });

    const result = await sql`UPDATE queue_entries SET status = 'served', served_at = now() WHERE id = ${id} AND status = 'called' RETURNING id, student_name, student_id, queue_number, status, served_at`;
    return Response.json(result[0]);
  } catch (error) {
    console.error("Failed to mark student as served:", error);
    return Response.json({ error: "Unable to update student" }, { status: 500 });
  }
}
