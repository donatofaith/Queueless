import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f7f6] text-[#15201c]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#123c31] text-lg font-bold text-white">Q</div>
            <div>
              <p className="text-lg font-semibold tracking-tight">QueueLess</p>
              <p className="text-xs text-[#66756f]">School queue system</p>
            </div>
          </div>
          <span className="rounded-full border border-[#d9e3df] bg-white px-3 py-1.5 text-xs font-medium text-[#53625d]">Digital queue system</span>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-xl">
              <span className="mb-5 inline-flex rounded-full bg-[#dff0e9] px-3 py-1.5 text-xs font-semibold text-[#1f604e]">No more waiting around</span>
              <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">One queue. Less waiting.</h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-[#66756f] sm:text-lg">QueueLess helps students join school office queues digitally, track their turn, and know exactly when to move.</p>
            </div>

            <div className="rounded-[28px] border border-[#dce5e1] bg-white p-6 shadow-[0_18px_60px_rgba(18,60,49,0.08)] sm:p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-semibold tracking-tight">How are you using QueueLess?</h2>
                <p className="mt-2 text-sm leading-6 text-[#71807a]">Choose your portal to continue.</p>
              </div>

              <div className="grid gap-4">
                <Link href="/student" className="group rounded-2xl border border-[#dce5e1] p-5 transition hover:border-[#2d6a58] hover:bg-[#f8fbfa]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">I’m a Student</p>
                      <p className="mt-1 text-sm leading-6 text-[#71807a]">Join an office queue and track your position in real time.</p>
                    </div>
                    <span className="text-xl transition group-hover:translate-x-1">→</span>
                  </div>
                </Link>

                <Link href="/staff" className="group rounded-2xl border border-[#dce5e1] p-5 transition hover:border-[#2d6a58] hover:bg-[#f8fbfa]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">I’m Staff</p>
                      <p className="mt-1 text-sm leading-6 text-[#71807a]">View the active queue, call students, and mark visits as served.</p>
                    </div>
                    <span className="text-xl transition group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
