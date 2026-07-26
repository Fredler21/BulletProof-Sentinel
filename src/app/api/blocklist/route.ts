import { NextRequest, NextResponse } from "next/server";
import { blockIp, listBlockedIps } from "@/lib/server/blocklist";
import { requireSessionUser } from "@/lib/server/session";
import { requireRoleWithUser, roleGateStatus } from "@/lib/server/roles";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await requireSessionUser();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const blocks = await listBlockedIps();
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest): Promise<Response> {
  // Blocking an IP is a defensive action — viewers are read-only.
  let user;
  try {
    ({ user } = await requireRoleWithUser("it-admin"));
  } catch (err) {
    const status = roleGateStatus(err);
    return NextResponse.json(
      { error: status === 403 ? "forbidden" : "unauthenticated" },
      { status },
    );
  }
  const body = (await req.json().catch(() => ({}))) as {
    ip?: string;
    reason?: string;
    ttlHours?: number | null;
  };
  if (!body.ip) {
    return NextResponse.json({ error: "missing_ip" }, { status: 400 });
  }
  // Basic IP/host shape validation
  const ip = body.ip.trim();
  if (ip.length < 3 || ip.length > 64) {
    return NextResponse.json({ error: "invalid_ip" }, { status: 400 });
  }
  const block = await blockIp({
    ip,
    reason: body.reason?.trim() || "Manual block",
    source: "manual",
    createdByUid: user.uid,
    ttlHours: body.ttlHours ?? null,
  });
  return NextResponse.json({ block });
}
