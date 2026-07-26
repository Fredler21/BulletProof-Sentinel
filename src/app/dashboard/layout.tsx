import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/server/session";
import { ensureRoleForUser, ROLE_LABEL } from "@/lib/server/roles";
import { LogoutButton } from "@/app/dashboard/_components/LogoutButton";
import { NavLink } from "@/app/dashboard/_components/NavLink";

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: string }[];
}[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard", label: "Overview", icon: "◱" },
      { href: "/dashboard/events", label: "Events", icon: "≡" },
      { href: "/dashboard/incidents", label: "Incidents", icon: "◆" },
      { href: "/dashboard/alerts", label: "Alerts", icon: "!" },
    ],
  },
  {
    label: "Defense",
    items: [
      { href: "/dashboard/scanner", label: "Scanner", icon: "◎" },
      { href: "/dashboard/honeypots", label: "Honeypots", icon: "✧" },
      { href: "/dashboard/projects", label: "Embed API", icon: "⌘" },
      { href: "/dashboard/blocklist", label: "Blocklist", icon: "⊘" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/dashboard/copilot", label: "AI Copilot", icon: "✦" },
      { href: "/dashboard/posture", label: "Posture", icon: "◈" },
      { href: "/dashboard/compliance", label: "Compliance", icon: "▤" },
      { href: "/dashboard/reports", label: "Reports", icon: "▥" },
    ],
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  const role = await ensureRoleForUser(user);
  const isSuperAdmin = role.role === "super-admin";
  const displayName = user.displayName ?? user.email ?? user.uid;
  const initial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="holo-bg relative min-h-screen text-sentinel-fg">
      <div className="hex-grid pointer-events-none absolute inset-0" />
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-sentinel-border/70 md:flex md:flex-col">
          <div className="sticky top-0 flex h-screen flex-col">
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-5 py-5">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-sentinel-accent/30 bg-sentinel-accent/10 text-sentinel-accent">
                <span className="text-sm font-bold">S</span>
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight text-white">
                  Sentinel
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-sentinel-faint">
                  Security Operations
                </p>
              </div>
            </div>

            {/* Live console CTA */}
            <div className="px-3">
              <Link
                href="/dashboard/live"
                className="flex items-center justify-between rounded-lg border border-sentinel-border bg-sentinel-panel px-3 py-2 text-[12px] font-medium text-slate-200 transition-colors hover:border-sentinel-accent/40 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-sentinel-ok/70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sentinel-ok" />
                  </span>
                  Live Console
                </span>
                <span className="text-sentinel-faint">↗</span>
              </Link>
            </div>

            {/* Nav */}
            <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
              {NAV_GROUPS.map((g) => (
                <div key={g.label} className="mb-5">
                  <p className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-sentinel-faint">
                    {g.label}
                  </p>
                  <div className="space-y-0.5">
                    {g.items.map((it) => (
                      <NavLink
                        key={it.href}
                        href={it.href}
                        label={it.label}
                        icon={it.icon}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {isSuperAdmin && (
                <div className="mb-5">
                  <p className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-sentinel-faint">
                    Admin
                  </p>
                  <NavLink href="/dashboard/roles" label="User Roles" icon="⚙" />
                </div>
              )}
            </nav>

            {/* User */}
            <div className="border-t border-sentinel-border/70 p-3">
              <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sentinel-accent/15 text-xs font-semibold text-sentinel-accent">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-sentinel-faint">
                    {ROLE_LABEL[role.role]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sentinel-border/70 bg-sentinel-bg/80 px-4 py-3 backdrop-blur-md md:px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium text-slate-200 md:hidden"
            >
              <span className="grid h-6 w-6 place-items-center rounded-md bg-sentinel-accent/10 text-xs font-bold text-sentinel-accent">
                S
              </span>
              Sentinel
            </Link>
            <div className="hidden items-center gap-2 text-[12px] text-sentinel-faint md:flex">
              <span className="flex h-2 w-2 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-sentinel-ok" />
              </span>
              Monitoring active
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[12px] font-medium text-slate-200">
                  {displayName}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-sentinel-faint">
                  {ROLE_LABEL[role.role]}
                </p>
              </div>
              <LogoutButton />
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
