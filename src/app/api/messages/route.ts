import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public, unauthenticated write endpoint for the contact form.
 *
 * It mirrors the production behaviour of the Supabase RLS policy
 * "public can insert messages":
 *   - only `name` and `message` are accepted
 *   - name:    1..80 characters after trimming
 *   - message: 1..2000 characters after trimming
 *   - everything else (read / created_at / id) is set by the database
 *
 * There is deliberately NO GET handler: public visitors must never be able to
 * read messages — that stays behind admin_users + RLS in production.
 */

const NAME_MAX = 80;
const MESSAGE_MAX = 2000;

type RateBucket = { count: number; resetAt: number };
const buckets = new Map<string, RateBucket>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  return bucket.count > MAX_PER_WINDOW;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;

  // Honeypot: real visitors never fill this field. Silently accept and drop.
  if (asString(payload.company).trim() !== "") {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // Basic content-type + size guard.
  const name = asString(payload.name).trim();
  const message = asString(payload.message).trim();

  if (!name || name.length > NAME_MAX) {
    return NextResponse.json({ ok: false, error: "invalid_name" }, { status: 400 });
  }
  if (!message || message.length > MESSAGE_MAX) {
    return NextResponse.json({ ok: false, error: "invalid_message" }, { status: 400 });
  }
  if (rateLimited(clientIp(req))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const [row] = await db
      .insert(messages)
      .values({ name, message })
      .returning({ id: messages.id, createdAt: messages.createdAt });

    return NextResponse.json({ ok: true, id: row?.id ?? null }, { status: 201 });
  } catch (error) {
    // Never leak SQL / driver details to the client.
    console.error("[api/messages] insert failed", error);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json(
    { ok: false, error: "method_not_allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}
