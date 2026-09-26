"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Office = {
  id: string;
  name: string;
};

type QueueEntry = {
  id: string;
  studentName: string;
  studentId: string;
  officeId: string;
  officeName: string;
  queueNumber: number;
  status: "waiting" | "called" | "served" | "cancelled";
  position: number;
  joinedAt: string;
  calledAt?: string | null;
};

const statusCopy: Record<QueueEntry["status"], string> = {
  waiting: "Waiting",
  called: "You have been called",
  served: "Completed",
  cancelled: "Cancelled",
};

export default function StudentPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOffices() {
      try {
        const response = await fetch("/api/offices");
        if (!response.ok) throw new Error();
        const data: Office[] = await response.json();
        setOffices(data);
        if (data.length > 0) setOfficeId(data[0].id);
      } catch {
        setError("Unable to load offices. Please refresh the page.");
      } finally {
        setLoadingOffices(false);
      }
    }

    loadOffices();

    const savedId = window.localStorage.getItem("queueless-entry-id");
    if (savedId) loadQueueEntry(savedId);
  }, []);

  useEffect(() => {
    if (!queueEntry || queueEntry.status !== "waiting") return;

    const interval = window.setInterval(() => {
      loadQueueEntry(queueEntry.id);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [queueEntry?.id, queueEntry?.status]);

  async function loadQueueEntry(id: string) {
    try {
      const response = await fetch(`/api/queue/${id}`, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404) {
          window.localStorage.removeItem("queueless-entry-id");
        }
        return;
      }
      const data: QueueEntry = await response.json();
      setQueueEntry(data);
    } catch {}
  }

  async function joinQueue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, studentId, officeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to join the queue.");
        return;
      }

      setQueueEntry(data);
      window.localStorage.setItem("queueless-entry-id", data.id);
    } catch {
      setError("Unable to join the queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function leaveTrackingView() {
    window.localStorage.removeItem("queueless-entry-id");
    setQueueEntry(null);
    setStudentName("");
    setStudentId("");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f6] text-[#15201c]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123c31] text-lg font-bold text-white">Q</div>
            <div>
              <p className="text-lg font-semibold tracking-tight">QueueLess</p>
              <p className="text-xs text-[#66756f]">School queue system</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-full border border-[#d9e3df] bg-white px-3 py-1.5 text-xs font-medium text-[#53625d] transition hover:bg-[#eef3f1]">Back home</Link>
            <span className="rounded-full border border-[#d9e3df] bg-white px-3 py-1.5 text-xs font-medium text-[#53625d]">Student portal</span>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-xl">
              <span className="mb-5 inline-flex rounded-full bg-[#dff0e9] px-3 py-1.5 text-xs font-semibold text-[#1f604e]">Skip the physical line</span>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">Join the queue. Track your turn. Keep moving.</h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#66756f] sm:text-lg">Join a school office queue from your device and see exactly where you are without standing around.</p>
            </div>

            <div className="rounded-[28px] border border-[#dce5e1] bg-white p-5 shadow-[0_18px_60px_rgba(18,60,49,0.08)] sm:p-7">
              {queueEntry ? (
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-[#6a7973]">Your queue number</p>
                      <p className="mt-2 text-6xl font-semibold tracking-[-0.05em] text-[#123c31]">{queueEntry.queueNumber}</p>
                    </div>
                    <span className="rounded-full bg-[#e8f3ef] px-3 py-1.5 text-xs font-semibold text-[#1f604e]">{statusCopy[queueEntry.status]}</span>
                  </div>

                  <div className="my-7 h-px bg-[#e5ebe8]" />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-[#f5f8f7] p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#7a8983]">Office</p>
                      <p className="mt-2 font-semibold">{queueEntry.officeName}</p>
                    </div>
                    <div className="rounded-2xl bg-[#f5f8f7] p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#7a8983]">Current position</p>
                      <p className="mt-2 text-2xl font-semibold">{queueEntry.status === "waiting" ? queueEntry.position : "—"}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#dce5e1] p-4">
                    <p className="text-sm font-semibold">
                      {queueEntry.status === "waiting" && (queueEntry.position === 1 ? "You are next in line." : `${Math.max(queueEntry.position - 1, 0)} student${queueEntry.position - 1 === 1 ? "" : "s"} ahead of you.`)}
                      {queueEntry.status === "called" && "Please proceed to the office now."}
                      {queueEntry.status === "served" && "Your visit has been completed."}
                      {queueEntry.status === "cancelled" && "This queue entry is no longer active."}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#75847e]">Queue status refreshes automatically while you wait.</p>
                  </div>

                  {queueEntry.status !== "waiting" && (
                    <button type="button" onClick={leaveTrackingView} className="mt-5 w-full rounded-xl bg-[#123c31] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d3027]">Join another queue</button>
                  )}
                </div>
              ) : (
                <form onSubmit={joinQueue}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold tracking-tight">Join a queue</h2>
                    <p className="mt-1 text-sm text-[#71807a]">Enter your details and choose the office you need.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">Full name</span>
                      <input required value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="e.g. Faith Oluwalana" className="w-full rounded-xl border border-[#d7e0dc] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#a0aaa6] focus:border-[#2d6a58] focus:ring-2 focus:ring-[#d9ece5]" />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">Student ID</span>
                      <input required value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="e.g. CSC/22/1234" className="w-full rounded-xl border border-[#d7e0dc] bg-white px-4 py-3.5 text-sm outline-none transition placeholder:text-[#a0aaa6] focus:border-[#2d6a58] focus:ring-2 focus:ring-[#d9ece5]" />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">Office</span>
                      <select required value={officeId} onChange={(event) => setOfficeId(event.target.value)} className="w-full rounded-xl border border-[#d7e0dc] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#2d6a58] focus:ring-2 focus:ring-[#d9ece5]">
                        {loadingOffices && <option value="">Loading offices...</option>}
                        {!loadingOffices && offices.length === 0 && <option value="">No offices available</option>}
                        {offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                      </select>
                    </label>
                  </div>

                  {!loadingOffices && offices.length === 0 && !error && (
                    <p className="mt-4 rounded-xl bg-[#f3f6f5] px-4 py-3 text-sm text-[#66756f]">No office is currently accepting queue entries.</p>
                  )}

                  {error && <p className="mt-4 rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a43b35]">{error}</p>}

                  <button type="submit" disabled={loading || loadingOffices || !officeId} className="mt-6 w-full rounded-xl bg-[#123c31] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0d3027] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Joining queue..." : "Join queue"}</button>

                  <p className="mt-4 text-center text-xs text-[#87948f]">Your details are used only to manage your queue entry.</p>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
