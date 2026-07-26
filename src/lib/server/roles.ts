import { adminDb } from "@/lib/firebase/admin";
import { cached } from "@/lib/server/cache";
import { isQuotaError, markQuotaExceeded } from "@/lib/server/quotaGuard";
import { getSessionUser, requireSessionUser } from "@/lib/server/session";
import type { SessionUser, UserRole, UserRoleDoc } from "@/lib/types";

const COL = "user_roles";

const BOOTSTRAP_EMAILS = (process.env.SENTINEL_SUPER_ADMINS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const RANK: Record<UserRole, number> = {
  viewer: 0,
  "it-admin": 1,
  "security-analyst": 2,
  "super-admin": 3,
};

export async function getUserRole(uid: string): Promise<UserRoleDoc | null> {
  return cached(`role:${uid}`, 5 * 60_000, async () => {
    try {
      const snap = await adminDb.collection(COL).doc(uid).get();
      return (snap.data() as UserRoleDoc | undefined) ?? null;
    } catch (err) {
      if (isQuotaError(err)) markQuotaExceeded();
      return null;
    }
  });
}

function fallbackRole(user: SessionUser): UserRoleDoc {
  const isBootstrap =
    !!user.email && BOOTSTRAP_EMAILS.includes(user.email.toLowerCase());
  return {
    uid: user.uid,
    email: user.email,
    role: isBootstrap ? "super-admin" : "viewer",
    assignedByUid: null,
    updatedAt: Date.now(),
  };
}

export async function ensureRoleForUser(
  user: SessionUser,
): Promise<UserRoleDoc> {
  try {
    const existing = await getUserRole(user.uid);
    if (existing) return existing;
    const isBootstrap =
      !!user.email && BOOTSTRAP_EMAILS.includes(user.email.toLowerCase());
    // First-ever user becomes super-admin if no roles assigned yet.
    let role: UserRole = "viewer";
    if (isBootstrap) {
      role = "super-admin";
    } else {
      const any = await adminDb.collection(COL).limit(1).get();
      if (any.empty) role = "super-admin";
    }
    const doc: UserRoleDoc = {
      uid: user.uid,
      email: user.email,
      role,
      assignedByUid: null,
      updatedAt: Date.now(),
    };
    await adminDb.collection(COL).doc(user.uid).set(doc);
    return doc;
  } catch (err) {
    if (isQuotaError(err)) markQuotaExceeded();
    // Never block dashboard rendering on a quota / Firestore failure.
    return fallbackRole(user);
  }
}

export async function getCurrentRole(): Promise<UserRoleDoc | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return ensureRoleForUser(user);
}

export async function requireRole(min: UserRole): Promise<UserRoleDoc> {
  const user = await requireSessionUser();
  const r = await ensureRoleForUser(user);
  if (RANK[r.role] < RANK[min]) {
    throw new Error("FORBIDDEN");
  }
  return r;
}

/**
 * Like requireRole, but also returns the session user (needed when a handler
 * both gates on role and uses the caller's identity, e.g. alert assignment).
 * Verifies the session only once.
 */
export async function requireRoleWithUser(
  min: UserRole,
): Promise<{ user: SessionUser; role: UserRoleDoc }> {
  const user = await requireSessionUser();
  const role = await ensureRoleForUser(user);
  if (RANK[role.role] < RANK[min]) {
    throw new Error("FORBIDDEN");
  }
  return { user, role };
}

/**
 * Maps a requireRole/requireRoleWithUser rejection to an HTTP status:
 * 403 for an authenticated-but-under-privileged caller, 401 otherwise.
 */
export function roleGateStatus(err: unknown): 401 | 403 {
  return err instanceof Error && err.message === "FORBIDDEN" ? 403 : 401;
}

/** Minimum role allowed to perform defensive response actions. */
export const RESPONDER_MIN_ROLE: UserRole = "it-admin";

/** True if the role may perform defensive writes (block IPs, triage alerts). */
export function canRespond(role: UserRole): boolean {
  return RANK[role] >= RANK[RESPONDER_MIN_ROLE];
}

/**
 * Convenience for server components: does the current session's role permit
 * defensive response actions? Used to hide write controls from viewers.
 */
export async function currentUserCanRespond(): Promise<boolean> {
  const role = await getCurrentRole();
  return !!role && canRespond(role.role);
}

export async function listAllRoles(): Promise<UserRoleDoc[]> {
  // Safety bound against unbounded reads on the user_roles collection.
  const snap = await adminDb.collection(COL).limit(1000).get();
  return snap.docs
    .map((d) => d.data() as UserRoleDoc)
    .sort((a, b) => RANK[b.role] - RANK[a.role]);
}

export async function setRole(
  targetUid: string,
  role: UserRole,
  assignedByUid: string,
  email: string | null,
): Promise<void> {
  const doc: UserRoleDoc = {
    uid: targetUid,
    email,
    role,
    assignedByUid,
    updatedAt: Date.now(),
  };
  await adminDb.collection(COL).doc(targetUid).set(doc, { merge: true });
}

export const ROLE_LABEL: Record<UserRole, string> = {
  "super-admin": "Super Admin",
  "security-analyst": "Security Analyst",
  "it-admin": "IT Administrator",
  viewer: "Viewer",
};
