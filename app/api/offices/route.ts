import { sql } from "@/lib/db";
import { getStaffSession } from "@/lib/staff-auth";

export async function GET() {
  try {
    const staff = await getStaffSession();
    if (!staff) {
      const offices = await sql`SELECT id, name FROM offices WHERE is_active = true ORDER BY name ASC`;
      return Response.json(offices);
    }

    if (staff.role === "admin") {
      const offices = await sql`SELECT id, name FROM offices WHERE school_id = ${staff.schoolId} AND is_active = true ORDER BY name ASC`;
      return Response.json(offices);
    }

    if (!staff.officeId) return Response.json([]);
    const offices = await sql`SELECT id, name FROM offices WHERE id = ${staff.officeId} AND school_id = ${staff.schoolId} AND is_active = true`;
    return Response.json(offices);
  } catch (error) {
    console.error("Failed to load offices:", error);
    return Response.json({ error: "Unable to load offices" }, { status: 500 });
  }
}
