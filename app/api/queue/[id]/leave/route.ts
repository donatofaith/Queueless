import { sql } from "@/lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cancelled = await sql`
      UPDATE queue_entries SET status = 'cancelled', cancelled_at = now()
      WHERE id = ${id} AND status = 'waiting'
      RETURNING id, status, cancelled_at
    `;
    if (cancelled.length === 0) return Response.json({ error: "Only a waiting queue entry can be left" }, { status: 409 });
    return Response.json(cancelled[0]);
  } catch (error) {
    console.error("Failed to leave queue:", error);
    return Response.json({ error: "Unable to leave the queue" }, { status: 500 });
  }
}
