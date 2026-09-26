"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Office = {
  id: string;
  name: string;
};

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

  const selectedOffice = useMemo(
    () => offices.find((office) => office.id === officeId),
    [offices, officeId]
  );

  useEffect(() => {
    async function loadOffices() {
      try {
        const response = await fetch("/api/offices", { cache: "no-store" });
        if (!response.ok) throw new Error();
        const data: Office[] = await response.json();
        setOffices(data);
        if (data.length > 0) setOfficeId(data[0].id);
      } catch {
        setError("Unable to load offices. Please refresh the page.");
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
      const response = await fetch(`/api/staff/queue?officeId=${officeId}`, {
        cache: "no-store",
      });
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

  async function markServed() {
    if (!queue?.called) return;
    setActionLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/staff/queue/${queue.called.id}/served`, {
        method: "POST",
      });
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
    <main className="min-h-screen bg-[#f4f7f6] text-[#15201c]">
      <div className="mx-auto min-h-screen w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b border-[#dce5e1] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123c31] text-lg font-bold text-white">Q</div>
            <div>
              <p className="text-lg font-semibold tracking-tight">QueueLess</p>
              <p className="text-xs text-[#66756f]">Staff dashboard</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="rounded-xl border border-[#d7e0dc] bg-white px-4 py-2.5 text-sm font-medium text-[#53625d] transition hover:bg-[#eef3f1]">Back home</Link>
            <label className="text-sm font-medium text-[#53625d]">Office</label>
            <select
              value={officeId}
              onChange={(event) => setOfficeId(event.target.value)}
              disabled={offices.length === 0}
              className="rounded-xl border border-[#d7e0dc] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2d6a58] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {offices.length === 0 && <option value="">No offices available</option>}
              {offices.map((office) => (
                <option key={office.id} value={office.id}>{office.name}</option>
              ))}
            </select>
          </div>
        </header>

        <section className="py-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#66756f]">Active queue</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{selectedOffice?.name || "No office selected"}</h1>
            </div>
            {officeId && <p className="text-sm text-[#66756f]">Refreshes automatically every 3 seconds</p>}
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a43b35]">{error}</div>
          )}

          {loading ? (
            <p className="text-sm text-[#66756f]">Loading dashboard...</p>
          ) : offices.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#cfdad5] bg-white p-10 text-center">
              <p className="text-lg font-semibold">No active offices</p>
              <p className="mt-2 text-sm text-[#75847e]">When an office becomes available, it will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[24px] border border-[#dce5e1] bg-white p-6 shadow-[0_18px_60px_rgba(18,60,49,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8983]">Now serving</p>

                {queue?.called ? (
                  <div className="mt-5">
                    <p className="text-6xl font-semibold tracking-[-0.05em] text-[#123c31]">{queue.called.queue_number}</p>
                    <div className="mt-5 rounded-2xl bg-[#f5f8f7] p-4">
                      <p className="font-semibold">{queue.called.student_name}</p>
                      <p className="mt-1 text-sm text-[#6f7d78]">{queue.called.student_id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={markServed}
                      disabled={actionLoading}
                      className="mt-5 w-full rounded-xl bg-[#123c31] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d3027] disabled:opacity-50"
                    >
                      {actionLoading ? "Updating..." : "Mark as served"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-5">
                    <div className="rounded-2xl border border-dashed border-[#cfdad5] p-6 text-center">
                      <p className="font-medium">No student currently called</p>
                      <p className="mt-1 text-sm text-[#75847e]">{queue?.waitingCount ? "Call the next student when you are ready." : "There is nobody waiting in this queue yet."}</p>
                    </div>
                    <button
                      type="button"
                      onClick={callNext}
                      disabled={actionLoading || !queue || queue.waitingCount === 0}
                      className="mt-5 w-full rounded-xl bg-[#123c31] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d3027] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ? "Calling..." : queue?.waitingCount ? "Call next student" : "No student to call"}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-[#dce5e1] bg-white p-6 shadow-[0_18px_60px_rgba(18,60,49,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8983]">Waiting list</p>
                    <p className="mt-1 text-sm text-[#66756f]">{queue?.waitingCount ?? 0} student{(queue?.waitingCount ?? 0) === 1 ? "" : "s"} waiting</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {queue?.waiting.length ? (
                    queue.waiting.map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e1e8e5] px-4 py-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ef] font-semibold text-[#1f604e]">{student.queue_number}</div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{student.student_name}</p>
                            <p className="mt-1 truncate text-xs text-[#75847e]">{student.student_id}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#f3f6f5] px-3 py-1 text-xs font-medium text-[#66756f]">Position {index + 1}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#cfdad5] p-8 text-center">
                      <p className="font-medium">Queue is clear</p>
                      <p className="mt-1 text-sm text-[#75847e]">New students will appear here automatically after joining.</p>
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
