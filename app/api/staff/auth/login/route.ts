import { createStaffSession, verifyStaffAccessCode } from "@/lib/staff-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code ?? "");

    if (!code) return Response.json({ error: "Access code is required" }, { status: 400 });
    if (!(await verifyStaffAccessCode(code))) {
      return Response.json({ error: "Invalid staff access code" }, { status: 401 });
    }

    await createStaffSession();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Staff login failed:", error);
    return Response.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
