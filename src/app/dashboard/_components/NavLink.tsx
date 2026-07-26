"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: string;
}): React.ReactElement {
  const pathname = usePathname();
  // Overview matches exactly; every other item matches its subtree.
  const active =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors " +
        (active
          ? "bg-sentinel-accent/10 text-white"
          : "text-sentinel-muted hover:bg-white/[0.03] hover:text-slate-100")
      }
    >
      <span
        className={
          "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sentinel-accent transition-opacity " +
          (active ? "opacity-100" : "opacity-0")
        }
        aria-hidden
      />
      <span
        className={
          "w-4 text-center text-[12px] " +
          (active
            ? "text-sentinel-accent"
            : "text-sentinel-faint group-hover:text-slate-300")
        }
        aria-hidden
      >
        {icon ?? "·"}
      </span>
      <span>{label}</span>
    </Link>
  );
}
