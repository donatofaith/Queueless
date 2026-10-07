import { authenticateStaff, createStaffSession } from "@/lib/staff-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const staff = await authenticateStaff(email, password);
    if (!staff) return Response.json({ error: "Invalid email or password" }, { status: 401 });

    await createStaffSession(staff);
    return Response.json({ ok: true, staff: { name: staff.name, role: staff.role } });
  } catch (error) {
    console.error("Staff login failed:", error);
    return Response.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
