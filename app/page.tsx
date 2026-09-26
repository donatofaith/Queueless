import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen text-[#10201a]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="soft-button flex h-11 w-11 items-center justify-center rounded-2xl bg-[#123c31] text-lg font-bold text-white">Q</div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">QueueLess</p>
              <p className="text-xs text-[#73827c]">School queue system</p>
            </div>
          </div>
          <span className="soft-inset rounded-full px-4 py-2 text-xs font-semibold text-[#4f625a]">Live queue access</span>
        </header>

        <section className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
            <div className="fade-up max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#dfeee8] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#255b4c]">
                <span className="pulse-dot h-2 w-2 rounded-full bg-[#2f7b65]" />
                Built for campus life
              </div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.96] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
                Wait less.
                <br />
                Know your turn.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#66776f] sm:text-lg">
                Join a school office queue from anywhere on campus, track your position, and move only when it is your turn.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-xs font-semibold text-[#566861]">
                <span className="soft-inset rounded-full px-4 py-2">No physical line</span>
                <span className="soft-inset rounded-full px-4 py-2">Live position</span>
                <span className="soft-inset rounded-full px-4 py-2">Simple staff flow</span>
              </div>
            </div>

            <div className="soft-card fade-up-delay rounded-[34px] p-5 sm:p-7 lg:p-8">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#72817b]">Choose your portal</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">How are you using QueueLess?</h2>
                </div>
                <div className="soft-inset flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl">↗</div>
              </div>

              <div className="grid gap-4">
                <Link href="/student" className="group rounded-[24px] bg-[#123c31] p-6 text-white transition duration-300 hover:-translate-y-1 hover:bg-[#0d3329] soft-button">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Student</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Join & track your queue</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">Choose an office, get your number, and see exactly where you are.</p>
                    </div>
                    <span className="mt-1 text-2xl transition duration-300 group-hover:translate-x-1">→</span>
                  </div>
                </Link>

                <Link href="/staff" className="group soft-inset rounded-[24px] p-6 transition duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#72817b]">Staff</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#10201a]">Manage the live queue</p>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-[#6d7d76]">View waiting students, call the next person, and complete service.</p>
                    </div>
                    <span className="mt-1 text-2xl transition duration-300 group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-[#74837d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3c826d]" />
                Queue status updates automatically while the system is in use.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
