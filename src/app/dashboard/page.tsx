import { listRecentAlerts, listRecentEvents } from "@/lib/server/events";
import { listTraps } from "@/lib/server/honeypots";
import { listProjectsForUser } from "@/lib/server/projects";
import { requireSessionUser } from "@/lib/server/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

import type {
  AlertItem,
  DashboardStats,
  HoneypotProject,
  HoneypotTrap,
  SecurityEvent,
  ThreatSeverity,
} from "@/lib/types";
import { SeverityBadge } from "@/app/dashboard/_components/SeverityBadge";
import { TimeAgo } from "@/app/dashboard/_components/TimeAgo";

function computeStats(events: SecurityEvent[], traps: HoneypotTrap[]): DashboardStats {
  const ips = new Set<string>();
  let high = 0;
  for (const e of events) {
    if (e.ip) ips.add(e.ip);
    if (e.severity === "high" || e.severity === "critical") high += 1;
  }
  const honeypotHits = traps.reduce((sum, t) => sum + (t.hits ?? 0), 0);
  return {
    totalEvents: events.length,
    highSeverityEvents: high,
    honeypotHits,
    uniqueIps: ips.size,
  };
}

export default async function DashboardOverview(): Promise<React.ReactElement> {
  const user = await requireSessionUser();
  const [eventsResult, trapsResult, alertsResult, projectsResult] =
    await Promise.allSettled([
      listRecentEvents(50),
      listTraps(),
      listRecentAlerts(10),
      listProjectsForUser(user.uid),
    ]);
  const events: SecurityEvent[] =
    eventsResult.status === "fulfilled" ? eventsResult.value : [];
  const traps: HoneypotTrap[] =
    trapsResult.status === "fulfilled" ? trapsResult.value : [];
  const alerts: AlertItem[] =
    alertsResult.status === "fulfilled" ? alertsResult.value : [];
  const projects: HoneypotProject[] =
    projectsResult.status === "fulfilled" ? projectsResult.value : [];
  const stats = computeStats(events, traps);

  // Recent attacker IPs per project (from in-memory events).
  const projectAttackers = new Map<string, { ip: string; lastSeen: number }[]>();
  for (const e of events) {
    const meta =
      e.metadata && typeof e.metadata === "object" ? e.metadata : null;
    const pidRaw = meta ? (meta as Record<string, unknown>).projectId : null;
    const pid = typeof pidRaw === "string" ? pidRaw : null;
    if (!pid || !e.ip) continue;
    const list = projectAttackers.get(pid) ?? [];
    if (!list.some((x) => x.ip === e.ip)) {
      list.push({ ip: e.ip, lastSeen: e.createdAt });
      projectAttackers.set(pid, list);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm text-sentinel-muted">
          Real-time visibility into your monitored infrastructure.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Events" value={stats.totalEvents} tone="default" icon="≡" />
        <StatCard
          label="High Severity"
          value={stats.highSeverityEvents}
          tone="danger"
          icon="!"
        />
        <StatCard label="Honeypot Hits" value={stats.honeypotHits} tone="warn" icon="✧" />
        <StatCard label="Unique IPs" value={stats.uniqueIps} tone="default" icon="◈" />
      </div>

      {projects.length > 0 && (
        <Panel title="Your Honeypot Projects">
          <ProjectGrid projects={projects} attackers={projectAttackers} />
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Recent Events" className="lg:col-span-2">
          <EventTable events={events.slice(0, 12)} />
        </Panel>
        <Panel title="Active Alerts">
          <AlertList alerts={alerts} />
        </Panel>
      </div>
    </div>
  );
}

function ProjectGrid({
  projects,
  attackers,
}: {
  projects: HoneypotProject[];
  attackers: Map<string, { ip: string; lastSeen: number }[]>;
}): React.ReactElement {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => {
        const ips = (attackers.get(p.id) ?? [])
          .sort((a, b) => b.lastSeen - a.lastSeen)
          .slice(0, 4);
        return (
          <Link
            key={p.id}
            href={`/dashboard/projects/${p.id}`}
            className="group rounded-xl border border-sentinel-border bg-sentinel-bg/40 p-4 transition hover:border-sentinel-accent"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-sentinel-accent">
                  {p.name}
                </p>
                <p className="text-[11px] text-sentinel-muted">
                  {p.domain ?? "no domain"}
                </p>
              </div>
              <span className="rounded-full border border-sentinel-border px-2 py-0.5 text-[10px] text-sentinel-muted">
                {p.hits} hits
              </span>
            </div>
            <div className="mt-3 space-y-1">
              {ips.length === 0 ? (
                <p className="text-[11px] text-sentinel-muted/70">
                  No attacker IPs in recent window.
                </p>
              ) : (
                ips.map((a) => (
                  <p
                    key={a.ip}
                    className="font-mono text-[11px] text-slate-300"
                  >
                    {a.ip}
                  </p>
                ))
              )}
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-wide text-sentinel-muted group-hover:text-sentinel-accent">
              View attackers →
            </p>
          </Link>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "default" | "danger" | "warn";
  icon: string;
}): React.ReactElement {
  const accent =
    tone === "danger"
      ? "text-sentinel-danger"
      : tone === "warn"
        ? "text-sentinel-warn"
        : "text-sentinel-accent";
  const iconBg =
    tone === "danger"
      ? "bg-sentinel-danger/10 text-sentinel-danger"
      : tone === "warn"
        ? "bg-sentinel-warn/10 text-sentinel-warn"
        : "bg-sentinel-accent/10 text-sentinel-accent";
  return (
    <div className="surface surface-hover p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-sentinel-muted">
          {label}
        </p>
        <span
          className={`grid h-7 w-7 place-items-center rounded-lg text-xs ${iconBg}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      <p className={`mt-3 text-2xl font-semibold tabular-nums ${accent}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section className={`surface shadow-card ${className ?? ""}`}>
      <header className="flex items-center justify-between border-b border-sentinel-border px-5 py-3.5">
        <h2 className="text-[13px] font-semibold tracking-tight text-white">
          {title}
        </h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EventTable({
  events,
}: {
  events: SecurityEvent[];
}): React.ReactElement {
  if (events.length === 0) {
    return (
      <p className="text-sm text-sentinel-muted">No events recorded yet.</p>
    );
  }
  return (
    <div className="-mx-5 -mb-5 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-[10px] uppercase tracking-wider text-sentinel-faint">
          <tr className="border-b border-sentinel-border">
            <th className="px-5 py-2 font-medium">Time</th>
            <th className="px-2 py-2 font-medium">Severity</th>
            <th className="px-2 py-2 font-medium">Type</th>
            <th className="px-2 py-2 font-medium">IP</th>
            <th className="px-5 py-2 font-medium">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sentinel-border/50">
          {events.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="whitespace-nowrap px-5 py-2.5 text-xs text-sentinel-muted">
                <TimeAgo timestamp={e.createdAt} />
              </td>
              <td className="px-2 py-2.5">
                <SeverityBadge severity={e.severity as ThreatSeverity} />
              </td>
              <td className="px-2 py-2.5 font-mono text-[11px] text-slate-300">
                {e.type}
              </td>
              <td className="px-2 py-2.5 font-mono text-[11px] text-slate-300">
                {e.ip ?? "—"}
              </td>
              <td className="max-w-0 truncate px-5 py-2.5 text-slate-200">
                {e.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertList({
  alerts,
}: {
  alerts: AlertItem[];
}): React.ReactElement {
  if (alerts.length === 0) {
    return <p className="text-sm text-sentinel-muted">No active alerts.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {alerts.map((a) => (
        <li
          key={a.id}
          className="rounded-lg border border-sentinel-border bg-sentinel-bg/40 p-3 transition-colors hover:border-sentinel-borderStrong"
        >
          <div className="flex items-center justify-between">
            <SeverityBadge severity={a.severity} />
            <span className="text-[11px] text-sentinel-faint">
              <TimeAgo timestamp={a.createdAt} />
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-slate-100">
            {a.title}
          </p>
          <p className="mt-1 font-mono text-[11px] text-sentinel-faint">
            {a.source}
          </p>
        </li>
      ))}
    </ul>
  );
}
