import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  const db = getDb();
  const space = db.spaces[params.spaceId] ||
    Object.values(db.spaces).find((s) => s.slug === params.spaceId);
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(space);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  const db = getDb();
  const space = db.spaces[params.spaceId];
  if (!space) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, description, icon } = await req.json();
  if (name !== undefined) space.name = name;
  if (description !== undefined) space.description = description;
  if (icon !== undefined) space.icon = icon;
  space.updated_at = new Date().toISOString();
  saveDb(db);

  return NextResponse.json(space);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { spaceId: string } }
) {
  const db = getDb();
  // Delete all documents in this space
  for (const [docId, doc] of Object.entries(db.documents)) {
    if (doc.space_id === params.spaceId) delete db.documents[docId];
  }
  delete db.spaces[params.spaceId];
  saveDb(db);
  return NextResponse.json({ ok: true });
}
