import { auth } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const MAX_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = await getDb();
  const messages = await db
    .collection("messages")
    .find()
    .sort({ createdAt: 1 })
    .limit(50)
    .toArray();

  return NextResponse.json(
    messages.map((m) => ({ ...m, _id: m._id.toString() }))
  );
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "Trop de messages, veuillez patienter" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const content = String(
    (body as Record<string, unknown>).content ?? ""
  ).trim();

  if (!content) {
    return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400 });
  }
  if (content.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Message trop long (${MAX_LENGTH} caractères max)` },
      { status: 400 }
    );
  }

  const db = await getDb();
  const doc = {
    content,
    userId: session.user.id,
    userName: session.user.name,
    createdAt: new Date(),
  };
  const result = await db.collection("messages").insertOne(doc);

  return NextResponse.json(
    { ...doc, _id: result.insertedId.toString() },
    { status: 201 }
  );
}
