import Link from "next/link";

const FEATURES: { title: string; desc: string; icon: string }[] = [
  {
    icon: "✧",
    title: "Deceive",
    desc: "Custom honeypots that look like real production systems and catch attackers in the act.",
  },
  {
    icon: "≡",
    title: "Detect",
    desc: "Every probe, login attempt, and trap hit is logged, fingerprinted, and ranked by severity.",
  },
  {
    icon: "✦",
    title: "Respond",
    desc: "AI explains each incident in plain language and recommends the right defensive action.",
  },
];

export default function HomePage(): React.ReactElement {
  return (
    <main className="holo-bg relative min-h-screen overflow-hidden">
      <div className="hex-grid pointer-events-none absolute inset-0" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-sentinel-accent/30 bg-sentinel-accent/10 text-sm font-bold text-sentinel-accent">
            S
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">
            Sentinel
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-sentinel-accent px-3.5 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-300"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-6 pb-8 pt-16 text-center md:pt-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-sentinel-border bg-sentinel-panel/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-sentinel-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-sentinel-ok" />
          Security Operations Platform
        </span>
        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Detect, deceive, and document attackers in real time
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-sentinel-muted">
          Bulletproof Sentinel is a modern cyber-defense console: deploy custom
          honeypots, capture every intrusion attempt, and triage threats with AI
          — all from one operations dashboard.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-lg bg-sentinel-accent px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-card transition-colors hover:bg-cyan-300"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-sentinel-border bg-sentinel-panel px-5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-sentinel-borderStrong hover:bg-sentinel-panelHover"
          >
            Sign in
          </Link>
        </div>
      </section>

      <section className="relative mx-auto grid w-full max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="surface surface-hover p-5 shadow-card"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-sentinel-border bg-sentinel-bg text-sentinel-accent">
              {f.icon}
            </span>
            <h3 className="mt-3 text-sm font-semibold text-white">{f.title}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-sentinel-muted">
              {f.desc}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
