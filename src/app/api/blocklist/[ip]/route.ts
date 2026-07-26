import { NextResponse } from "next/server";
import { unblockIp } from "@/lib/server/blocklist";
import { requireRole, roleGateStatus } from "@/lib/server/roles";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ ip: string }> },
): Promise<Response> {
  // Unblocking an IP is a defensive action — viewers are read-only.
  try {
    await requireRole("it-admin");
  } catch (err) {
    const status = roleGateStatus(err);
    return NextResponse.json(
      { error: status === 403 ? "forbidden" : "unauthenticated" },
      { status },
    );
  }
  const { ip } = await params;
  await unblockIp(decodeURIComponent(ip));
  return NextResponse.json({ ok: true });
}
