"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Office = { id: string; name: string };
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
  called: "Called",
  served: "Completed",
  cancelled: "Cancelled",
};

export default function StudentPage() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null);
  const [savedQueueId, setSavedQueueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      }
    }

    loadOffices();
    setSavedQueueId(window.localStorage.getItem("queueless-entry-id"));
  }, []);

  useEffect(() => {
    if (!queueEntry || !["waiting", "called"].includes(queueEntry.status)) return;
    const interval = window.setInterval(() => loadQueueEntry(queueEntry.id), 3000);
    return () => window.clearInterval(interval);
  }, [queueEntry?.id, queueEntry?.status]);

  async function loadQueueEntry(id: string) {
    try {
      const response = await fetch(`/api/queue/${id}`, { cache: "no-store" });
      if (!response.ok) {
        if (response.status === 404) {
          window.localStorage.removeItem("queueless-entry-id");
          setSavedQueueId(null);
        }
        return;
      }
      setQueueEntry(await response.json());
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
      setSavedQueueId(data.id);
      window.localStorage.setItem("queueless-entry-id", data.id);
    } catch {
      setError("Unable to join the queue. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startAnotherQueue() {
    setQueueEntry(null);
    setStudentName("");
    setStudentId("");
    setError("");
  }

  function clearSavedQueue() {
    window.localStorage.removeItem("queueless-entry-id");
    setSavedQueueId(null);
    setQueueEntry(null);
  }

  return (
    <main className="min-h-screen text-[#10201a]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.svg" alt="QueueLess logo" className="h-11 w-11 rounded-2xl shadow-[0_10px_25px_rgba(18,60,49,0.16)]" />
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">QueueLess</p>
              <p className="text-xs text-[#73827c]">Student portal</p>
            </div>
          </Link>
          <Link href="/" className="soft-inset rounded-full px-4 py-2 text-xs font-semibold text-[#52635c] transition hover:text-[#123c31]">← Home</Link>
        </header>

        <section className="flex flex-1 items-center py-10 lg:py-14">
          <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="fade-up max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#dfeee8] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#255b4c]">
                <span className="pulse-dot h-2 w-2 rounded-full bg-[#2f7b65]" />
                Student access
              </div>
              <h1 className="text-5xl font-semibold leading-[0.98] tracking-[-0.065em] sm:text-6xl">Your place in line, without the line.</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#697972] sm:text-lg">Join the office queue, keep moving around campus, and check your turn from your phone.</p>
            </div>

            <div className="soft-card fade-up-delay rounded-[34px] p-5 sm:p-7 lg:p-8">
              {queueEntry ? (
                <div>
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#76857e]">Queue number</p>
                      <p className="mt-2 text-7xl font-semibold tracking-[-0.07em] text-[#123c31]">{queueEntry.queueNumber}</p>
                    </div>
                    <span className="soft-inset rounded-full px-4 py-2 text-xs font-bold text-[#2a624f]">{statusCopy[queueEntry.status]}</span>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="soft-inset rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b8983]">Office</p>
                      <p className="mt-2 text-lg font-semibold">{queueEntry.officeName}</p>
                    </div>
                    <div className="soft-inset rounded-[22px] p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b8983]">Current position</p>
                      <p className="mt-2 text-3xl font-semibold">{queueEntry.status === "waiting" ? queueEntry.position : "—"}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[22px] border border-white/80 bg-white/60 p-5">
                    <p className="text-lg font-semibold tracking-[-0.02em]">
                      {queueEntry.status === "waiting" && (queueEntry.position === 1 ? "You’re next." : `${Math.max(queueEntry.position - 1, 0)} student${queueEntry.position - 1 === 1 ? "" : "s"} ahead of you.`)}
                      {queueEntry.status === "called" && "It’s your turn — proceed to the office."}
                      {queueEntry.status === "served" && "You’re all done."}
                      {queueEntry.status === "cancelled" && "This queue entry is no longer active."}
                    </p>
                    <p className="mt-2 text-sm text-[#72817b]">Your queue status refreshes automatically.</p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={startAnotherQueue} className="soft-button rounded-2xl bg-[#123c31] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#0d3329]">Join another queue</button>
                    <button type="button" onClick={clearSavedQueue} className="soft-inset rounded-2xl px-5 py-4 text-sm font-bold text-[#52635c] transition hover:text-[#123c31]">Forget this queue</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={joinQueue}>
                  {savedQueueId && (
                    <div className="mb-5 flex flex-col gap-3 rounded-[22px] border border-[#cfe0d9] bg-[#eef6f2] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#173c31]">You already have a saved queue.</p>
                        <p className="mt-1 text-xs text-[#6f8079]">You can resume it or start a new one.</p>
                      </div>
                      <button type="button" onClick={() => loadQueueEntry(savedQueueId)} className="rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#245b4b] shadow-sm">View saved queue</button>
                    </div>
                  )}

                  <div className="mb-7">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#71817a]">New queue entry</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Join a queue</h2>
                    <p className="mt-2 text-sm leading-6 text-[#71807a]">Enter your details and choose the office you need.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">Full name</span>
                      <input required value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g. Faith Oluwalana" className="soft-inset w-full rounded-2xl border-0 px-4 py-4 text-sm outline-none placeholder:text-[#9da9a4] focus:ring-2 focus:ring-[#bcd8cd]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">Student ID</span>
                      <input required value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. CSC/22/1234" className="soft-inset w-full rounded-2xl border-0 px-4 py-4 text-sm outline-none placeholder:text-[#9da9a4] focus:ring-2 focus:ring-[#bcd8cd]" />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold">Office</span>
                      <select required value={officeId} onChange={(e) => setOfficeId(e.target.value)} className="soft-inset w-full rounded-2xl border-0 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-[#bcd8cd]">
                        {offices.length === 0 && <option value="">No offices available</option>}
                        {offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                      </select>
                    </label>
                  </div>

                  {error && <p className="mt-4 rounded-2xl bg-[#fff0ef] px-4 py-3 text-sm text-[#a43b35]">{error}</p>}

                  <button type="submit" disabled={loading || !officeId} className="soft-button mt-6 w-full rounded-2xl bg-[#123c31] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#0d3329] disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Joining queue..." : "Join queue →"}</button>
                  <p className="mt-4 text-center text-xs text-[#819089]">Your details are used only to manage this queue entry.</p>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
