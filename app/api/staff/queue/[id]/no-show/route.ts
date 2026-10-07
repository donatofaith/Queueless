import { sql } from "@/lib/db";
import { canAccessOffice, requireStaff } from "@/lib/staff-auth";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStaff();
    if ("response" in auth) return auth.response;
    const { session } = auth;
    const { id } = await params;

    const entry = await sql`
      SELECT q.office_id FROM queue_entries q
      JOIN offices o ON o.id = q.office_id
      WHERE q.id = ${id} AND q.status = 'called' AND o.school_id = ${session.schoolId}
      LIMIT 1
    `;
    if (entry.length === 0) return Response.json({ error: "Called student not found" }, { status: 404 });
    const officeId = String(entry[0].office_id);
    if (!canAccessOffice(session, officeId)) return Response.json({ error: "You are not authorized for this office" }, { status: 403 });

    const result = await sql`
      UPDATE queue_entries SET status = 'no_show', no_show_at = now()
      WHERE id = ${id} AND status = 'called'
      RETURNING id, status, no_show_at
    `;
    return Response.json(result[0]);
  } catch (error) {
    console.error("Failed to mark no-show:", error);
    return Response.json({ error: "Unable to update student" }, { status: 500 });
  }
}
