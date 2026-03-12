import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const db = getDb();
  const versions = db.versions
    .filter((v) => v.document_id === params.docId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 50);
  return NextResponse.json(versions);
}
