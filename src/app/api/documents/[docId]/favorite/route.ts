import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const db = getDb();
  const doc = db.documents[params.docId];
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  doc.is_favorite = doc.is_favorite ? 0 : 1;
  saveDb(db);

  return NextResponse.json({ is_favorite: doc.is_favorite });
}
