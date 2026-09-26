import { sql } from "@/lib/db";

export async function GET() {
  const result = await sql`
    SELECT name, is_active
    FROM offices
    ORDER BY created_at ASC
  `;

  return Response.json(result);
}