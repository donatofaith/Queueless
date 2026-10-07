import { clearStaffSession } from "@/lib/staff-auth";

export async function POST() {
  await clearStaffSession();
  return Response.json({ ok: true });
}
