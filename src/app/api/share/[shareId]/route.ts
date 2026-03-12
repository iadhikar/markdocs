import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  const db = getDb();
  const doc = Object.values(db.documents).find((d) => d.share_id === params.shareId);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    tags: doc.tags,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  });
}
