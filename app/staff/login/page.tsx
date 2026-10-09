"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/staff/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to sign in.");
        return;
      }
      router.replace("/staff");
      router.refresh();
    } catch {
      setError("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 text-[#10201a]">
      <section className="soft-card w-full max-w-md rounded-[30px] p-7 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.svg" alt="QueueLess logo" className="h-11 w-11 rounded-2xl" />
            <div><p className="text-lg font-semibold">QueueLess</p><p className="text-xs text-[#73827c]">Staff access</p></div>
          </Link>
          <Link href="/" className="soft-inset rounded-full px-4 py-2 text-xs font-semibold text-[#52635c] transition hover:text-[#123c31]">← Back</Link>
        </div>
        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.04em]">Staff sign in</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f7f78]">Sign in with your school staff account to manage your assigned queue.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="Staff email" className="soft-inset w-full rounded-2xl border-0 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-[#bcd8cd]" />
          <div className="soft-inset flex items-center rounded-2xl pr-3">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="Password" className="w-full border-0 bg-transparent px-4 py-4 text-sm outline-none" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-[#52635c]">{showPassword ? "Hide" : "Show"}</button>
          </div>
          {error && <div className="rounded-2xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a43b35]">{error}</div>}
          <button disabled={loading} className="soft-button w-full rounded-2xl bg-[#123c31] px-5 py-4 text-sm font-bold text-white disabled:opacity-50">{loading ? "Signing in..." : "Sign in →"}</button>
        </form>
      </section>
    </main>
  );
}
