import { sql } from "@/lib/db";
import { requireStaff } from "@/lib/staff-auth";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const unauthorized = await requireStaff();
    if (unauthorized) return unauthorized;

    const { id } = await params;
    const served = await sql`
      UPDATE queue_entries SET status = 'served', served_at = now()
      WHERE id = ${id} AND status = 'called'
      RETURNING id, student_name, student_id, queue_number, status, served_at
    `;
    if (served.length === 0) return Response.json({ error: "Called student not found" }, { status: 404 });
    return Response.json(served[0]);
  } catch (error) {
    console.error("Failed to mark student as served:", error);
    return Response.json({ error: "Unable to update student" }, { status: 500 });
  }
}
