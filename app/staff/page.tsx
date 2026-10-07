"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Office = { id: string; name: string };
type QueueStudent = {
  id: string;
  student_name: string;
  student_id: string;
  queue_number: number;
  status: "waiting" | "called";
  joined_at: string;
  called_at?: string | null;
};
type StaffQueueResponse = {
  office: Office;
  called: QueueStudent | null;
  waiting: QueueStudent[];
  waitingCount: number;
};

export default function StaffPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [officeId, setOfficeId] = useState("");
  const [queue, setQueue] = useState<StaffQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedOffice = useMemo(() => offices.find((office) => office.id === officeId), [offices, officeId]);

  useEffect(() => {
    async function loadOffices() {
      try {
        const response = await fetch("/api/offices", { cache: "no-store" });
        if (response.status === 401) { window.location.href = "/staff/login"; return; }
        if (!response.ok) throw new Error();
        const data: Office[] = await response.json();
        setOffices(data);
        if (data.length > 0) setOfficeId(data[0].id);
      } catch {
        setError("Unable to load offices.");
      } finally {
        setLoading(false);
      }
    }
    loadOffices();
  }, []);

  useEffect(() => {
    if (!officeId) return;
    loadQueue();
    const interval = window.setInterval(loadQueue, 3000);
    return () => window.clearInterval(interval);
  }, [officeId]);

  async function loadQueue() {
    try {
      const response = await fetch(`/api/staff/queue?officeId=${officeId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to load queue.");
        return;
      }
      setQueue(data);
      setError("");
    } catch {
      setError("Unable to load queue.");
    }
  }

  async function callNext() {
    if (!officeId) return;
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch("/api/staff/queue/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ officeId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to call next student.");
        return;
      }
      await loadQueue();
    } catch {
      setError("Unable to call next student.");
    } finally {
      setActionLoading(false);
    }
  }

  async function markNoShow() {
    if (!queue?.called) return;
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/staff/queue/${queue.called.id}/no-show`, { method: "POST" });
      const data = await response.json();
      if (response.status === 401) { window.location.href = "/staff/login"; return; }
      if (!response.ok) { setError(data.error || "Unable to mark no-show."); return; }
      await loadQueue();
    } catch {
      setError("Unable to mark no-show.");
    } finally {
      setActionLoading(false);
    }
  }

  async function markServed() {
    if (!queue?.called) return;
    setActionLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/staff/queue/${queue.called.id}/served`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to mark student as served.");
        return;
      }
      await loadQueue();
    } catch {
      setError("Unable to mark student as served.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen text-[#10201a]">
      <div className="mx-auto min-h-screen w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.svg" alt="QueueLess logo" className="h-11 w-11 rounded-2xl shadow-[0_10px_25px_rgba(18,60,49,0.16)]" />
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">QueueLess</p>
              <p className="text-xs text-[#73827c]">Staff dashboard</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="soft-inset rounded-full px-4 py-2 text-xs font-semibold text-[#52635c]">← Home</Link>
            <button type="button" onClick={async () => { await fetch("/api/staff/auth/logout", { method: "POST" }); window.location.href = "/staff/login"; }} className="soft-inset rounded-full px-4 py-2 text-xs font-semibold text-[#52635c]">Sign out</button>
            <select value={officeId} onChange={(e) => setOfficeId(e.target.value)} className="soft-inset rounded-2xl border-0 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#bcd8cd]">
              {offices.length === 0 && <option value="">No offices available</option>}
              {offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
            </select>
          </div>
        </header>

        <section className="py-9">
          <div className="fade-up mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#dfeee8] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#255b4c]">
                <span className="pulse-dot h-2 w-2 rounded-full bg-[#2f7b65]" /> Live queue
              </div>
              <h1 className="text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">{selectedOffice?.name || "Choose an office"}</h1>
              <p className="mt-2 text-sm text-[#6f7f78]">Manage the current line without the crowd.</p>
            </div>
            <div className="soft-inset rounded-full px-4 py-2 text-xs font-semibold text-[#66766f]">Auto-refresh · 3 sec</div>
          </div>

          {error && <div className="mb-5 rounded-2xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a43b35]">{error}</div>}

          {loading ? (
            <div className="soft-card rounded-[30px] p-8 text-sm text-[#687970]">Loading dashboard...</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
              <div className="soft-card fade-up rounded-[30px] p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#77867f]">Now serving</p>
                    <p className="mt-1 text-sm text-[#708078]">Current student</p>
                  </div>
                  <span className="soft-inset rounded-full px-3 py-1.5 text-xs font-bold text-[#2a624f]">Live</span>
                </div>

                {queue?.called ? (
                  <div className="mt-7">
                    <p className="text-8xl font-semibold tracking-[-0.08em] text-[#123c31]">{queue.called.queue_number}</p>
                    <div className="soft-inset mt-6 rounded-[24px] p-5">
                      <p className="text-xl font-semibold tracking-[-0.025em]">{queue.called.student_name}</p>
                      <p className="mt-1 text-sm text-[#6f7d78]">{queue.called.student_id}</p>
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={markServed} disabled={actionLoading} className="soft-button rounded-2xl bg-[#123c31] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#0d3329] disabled:opacity-50">{actionLoading ? "Updating..." : "Mark served →"}</button>
                      <button type="button" onClick={markNoShow} disabled={actionLoading} className="soft-inset rounded-2xl px-5 py-4 text-sm font-bold text-[#52635c] disabled:opacity-50">No-show</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-7">
                    <div className="soft-inset rounded-[24px] p-8 text-center">
                      <p className="text-lg font-semibold">No one is being served</p>
                      <p className="mt-2 text-sm leading-6 text-[#75847e]">Call the next student when the office is ready.</p>
                    </div>
                    <button type="button" onClick={callNext} disabled={actionLoading || !queue || queue.waitingCount === 0} className="soft-button mt-6 w-full rounded-2xl bg-[#123c31] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#0d3329] disabled:cursor-not-allowed disabled:opacity-45">{actionLoading ? "Calling..." : queue?.waitingCount ? "Call next student →" : "No student to call"}</button>
                  </div>
                )}
              </div>

              <div className="soft-card fade-up-delay rounded-[30px] p-6 sm:p-7">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#77867f]">Waiting list</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{queue?.waitingCount ?? 0} waiting</h2>
                  </div>
                  <div className="soft-inset flex h-14 min-w-14 items-center justify-center rounded-2xl px-4 text-2xl font-semibold text-[#123c31]">{queue?.waitingCount ?? 0}</div>
                </div>

                <div className="mt-6 space-y-3">
                  {queue?.waiting.length ? (
                    queue.waiting.map((student, index) => (
                      <div key={student.id} className="group flex items-center justify-between gap-4 rounded-[22px] bg-white/58 px-4 py-4 shadow-[inset_0_0_0_1px_rgba(18,60,49,.06)] transition hover:-translate-y-0.5 hover:bg-white/80">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="soft-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-[#235b4b]">{student.queue_number}</div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{student.student_name}</p>
                            <p className="mt-1 truncate text-xs text-[#75847e]">{student.student_id}</p>
                          </div>
                        </div>
                        <span className="soft-inset shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-[#63736c]">#{index + 1}</span>
                      </div>
                    ))
                  ) : (
                    <div className="soft-inset rounded-[24px] p-10 text-center">
                      <p className="text-lg font-semibold">The queue is clear</p>
                      <p className="mt-2 text-sm text-[#75847e]">New students will appear here automatically.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
