import { requireStaff } from "@/lib/staff-auth";

export async function GET() {
  const auth = await requireStaff();
  if ("response" in auth) return auth.response;
  const { staffId, schoolId, officeId, role, name } = auth.session;
  return Response.json({ staffId, schoolId, officeId, role, name });
}
