import { sql } from "@/lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const studentToken = String(body.studentToken ?? "");
    if (!studentToken) return Response.json({ error: "Queue verification is required" }, { status: 401 });

    const cancelled = await sql`
      UPDATE queue_entries SET status = 'cancelled', cancelled_at = now()
      WHERE id = ${id} AND status = 'waiting' AND student_token::text = ${studentToken}
      RETURNING id, status, cancelled_at
    `;
    if (cancelled.length === 0) return Response.json({ error: "Unable to leave this queue" }, { status: 403 });
    return Response.json(cancelled[0]);
  } catch (error) {
    console.error("Failed to leave queue:", error);
    return Response.json({ error: "Unable to leave the queue" }, { status: 500 });
  }
}
