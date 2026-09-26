import { sql } from "@/lib/db";

export async function GET() {
  try {
    const offices = await sql`
      SELECT id, name
      FROM offices
      WHERE is_active = true
      ORDER BY name ASC
    `;

    return Response.json(offices);
  } catch (error) {
    console.error("Failed to load offices:", error);
    return Response.json({ error: "Unable to load offices" }, { status: 500 });
  }
}
