"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

export function LogoutButton(): React.ReactElement {
  const router = useRouter();
  async function onClick(): Promise<void> {
    await signOut(firebaseAuth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-sentinel-border px-3 py-1.5 text-[12px] font-medium text-slate-300 transition-colors hover:border-sentinel-borderStrong hover:bg-sentinel-panelHover hover:text-white"
    >
      Sign out
    </button>
  );
}
