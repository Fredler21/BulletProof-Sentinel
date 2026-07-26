import type { ThreatSeverity } from "@/lib/types";

const styles: Record<ThreatSeverity, { chip: string; dot: string }> = {
  low: {
    chip: "bg-sentinel-ok/10 text-sentinel-ok border-sentinel-ok/25",
    dot: "bg-sentinel-ok",
  },
  medium: {
    chip: "bg-sentinel-warn/10 text-sentinel-warn border-sentinel-warn/25",
    dot: "bg-sentinel-warn",
  },
  high: {
    chip: "bg-sentinel-danger/10 text-sentinel-danger border-sentinel-danger/30",
    dot: "bg-sentinel-danger",
  },
  critical: {
    chip: "bg-sentinel-danger/15 text-sentinel-danger border-sentinel-danger/50",
    dot: "bg-sentinel-danger",
  },
};

export function SeverityBadge({
  severity,
}: {
  severity: ThreatSeverity;
}): React.ReactElement {
  const s = styles[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${s.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {severity}
    </span>
  );
}
