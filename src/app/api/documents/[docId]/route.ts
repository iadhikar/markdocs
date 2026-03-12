import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const db = getDb();
  const doc = db.documents[params.docId] ||
    Object.values(db.documents).find((d) => d.slug === params.docId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Increment view count
  if (doc.views === undefined) doc.views = 0;
  doc.views++;
  saveDb(db);

  return NextResponse.json(doc);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const db = getDb();
  const doc = db.documents[params.docId];
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Save version before updating
  db.versions.push({
    id: db.nextVersionId++,
    document_id: params.docId,
    content: doc.content,
    title: doc.title,
    created_at: new Date().toISOString(),
  });

  const body = await req.json();
  if (body.title !== undefined) {
    doc.title = body.title;
    doc.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (body.content !== undefined) doc.content = body.content;
  if (body.tags !== undefined) doc.tags = JSON.stringify(body.tags);
  if (body.parent_id !== undefined) doc.parent_id = body.parent_id;
  if (body.position !== undefined) doc.position = body.position;
  doc.updated_at = new Date().toISOString();

  saveDb(db);
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const db = getDb();
  delete db.documents[params.docId];
  db.versions = db.versions.filter((v) => v.document_id !== params.docId);
  saveDb(db);
  return NextResponse.json({ ok: true });
}
