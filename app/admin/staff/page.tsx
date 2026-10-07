"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Office = { id: string; name: string };
type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  is_active: boolean;
  office_id: string | null;
  office_name: string | null;
};

export default function AdminStaffPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [officeId, setOfficeId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [staffResponse, officesResponse] = await Promise.all([
        fetch("/api/admin/staff", { cache: "no-store" }),
        fetch("/api/offices", { cache: "no-store" }),
      ]);
      if (staffResponse.status === 401) {
        window.location.assign("/staff/login");
        return;
      }
      const staffData = await staffResponse.json();
      const officesData = await officesResponse.json();
      if (!staffResponse.ok) {
        setError(staffData.error || "Unable to load staff accounts.");
        return;
      }
      if (!officesResponse.ok) {
        setError(officesData.error || "Unable to load offices.");
        return;
      }
      setStaff(staffData);
      setOffices(officesData);
      if (officesData.length > 0) setOfficeId((current) => current || officesData[0].id);
    } catch {
      setError("Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, officeId: role === "staff" ? officeId : null }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to create account.");
        return;
      }
      setName("");
      setEmail("");
      setPassword("");
      setSuccess("Account created successfully.");
      await loadData();
    } catch {
      setError("Unable to create account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen text-[#10201a]">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#648078]">QueueLess Admin</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-[-0.05em]">Staff accounts</h1>
          </div>
          <Link href="/staff" className="soft-inset rounded-full px-4 py-2 text-xs font-semibold text-[#52635c]">← Staff dashboard</Link>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={createAccount} className="soft-card rounded-[30px] p-6 sm:p-7">
            <h2 className="text-2xl font-semibold">Create account</h2>
            <p className="mt-2 text-sm text-[#71807a]">Only school admins can create staff or additional admin accounts.</p>

            <div className="mt-6 space-y-4">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="soft-inset w-full rounded-2xl border-0 px-4 py-4 text-sm outline-none" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="soft-inset w-full rounded-2xl border-0 px-4 py-4 text-sm outline-none" />
              <div className="soft-inset flex items-center rounded-2xl pr-3">
                <input required minLength={8} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Temporary password" className="w-full border-0 bg-transparent px-4 py-4 text-sm outline-none" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="rounded-xl px-3 py-2 text-xs font-bold text-[#52635c]">{showPassword ? "Hide" : "Show"}</button>
              </div>
              <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")} className="soft-inset w-full rounded-2xl border-0 px-4 py-4 text-sm outline-none">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              {role === "staff" && (
                <select required value={officeId} onChange={(e) => setOfficeId(e.target.value)} className="soft-inset w-full rounded-2xl border-0 px-4 py-4 text-sm outline-none">
                  {offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                </select>
              )}
            </div>

            {error && <p className="mt-4 rounded-2xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a43b35]">{error}</p>}
            {success && <p className="mt-4 rounded-2xl bg-[#edf7f2] px-4 py-3 text-sm text-[#245b4b]">{success}</p>}

            <button disabled={saving || loading} className="soft-button mt-6 w-full rounded-2xl bg-[#123c31] px-5 py-4 text-sm font-bold text-white disabled:opacity-50">{saving ? "Creating..." : "Create account"}</button>
          </form>

          <div className="soft-card rounded-[30px] p-6 sm:p-7">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#77867f]">School access</p>
                <h2 className="mt-2 text-2xl font-semibold">{staff.length} account{staff.length === 1 ? "" : "s"}</h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <p className="text-sm text-[#71807a]">Loading accounts...</p>
              ) : staff.map((person) => (
                <div key={person.id} className="soft-inset rounded-[22px] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="mt-1 text-xs text-[#71807a]">{person.email}</p>
                    </div>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-[#245b4b]">{person.role}</span>
                  </div>
                  <p className="mt-3 text-xs text-[#71807a]">{person.role === "admin" ? "All offices in this school" : person.office_name || "No office assigned"}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
