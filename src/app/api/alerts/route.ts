import { NextRequest, NextResponse } from "next/server";
import {
  acknowledgeAlert,
  listRecentAlerts,
} from "@/lib/server/events";
import { requireSessionUser } from "@/lib/server/session";
import { requireRole, roleGateStatus } from "@/lib/server/roles";

export const dynamic = "force-dynamic";


export async function GET(): Promise<Response> {
  try {
    await requireSessionUser();
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const alerts = await listRecentAlerts(50);
  return NextResponse.json({ alerts });
}

export async function PATCH(req: NextRequest): Promise<Response> {
  // Acknowledging an alert is a triage action — viewers are read-only.
  try {
    await requireRole("it-admin");
  } catch (err) {
    const status = roleGateStatus(err);
    return NextResponse.json(
      { error: status === 403 ? "forbidden" : "unauthenticated" },
      { status },
    );
  }
  const body = (await req.json()) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }
  await acknowledgeAlert(body.id);
  return NextResponse.json({ ok: true });
}
