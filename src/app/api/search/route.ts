import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSearchIndex } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json([]);
  }

  const db = getDb();
  const index = getSearchIndex();

  // Re-index on every search (fast enough for JSON-based storage)
  const docs = Object.values(db.documents).filter((d) => d.is_template === 0);
  index.index(docs);

  const results = index.search(q, 20);
  return NextResponse.json(results);
}
