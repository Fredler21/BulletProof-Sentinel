import Link from "next/link";

// Force the auth route group out of static prerender so the Firebase client
// module is never evaluated at build-time (would crash without env vars).
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="holo-bg relative flex min-h-screen flex-col overflow-hidden">
      <div className="hex-grid pointer-events-none absolute inset-0" />
      <header className="relative px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-sentinel-accent/30 bg-sentinel-accent/10 text-sm font-bold text-sentinel-accent">
            S
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">
            Sentinel
          </span>
        </Link>
      </header>
      <div className="relative flex flex-1 items-center justify-center px-6 pb-16">
        {children}
      </div>
    </div>
  );
}
