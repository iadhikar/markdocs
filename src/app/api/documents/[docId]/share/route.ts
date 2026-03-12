import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { nanoid } from "nanoid";

export async function POST(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const db = getDb();
  const doc = db.documents[params.docId];
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (doc.share_id) {
    return NextResponse.json({ share_id: doc.share_id });
  }

  doc.share_id = nanoid(16);
  saveDb(db);
  return NextResponse.json({ share_id: doc.share_id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const db = getDb();
  const doc = db.documents[params.docId];
  if (doc) {
    doc.share_id = null;
    saveDb(db);
  }
  return NextResponse.json({ ok: true });
}
