import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { BM25Index } from "@/lib/search";

// GET: Search marketplace listings with BM25
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json([]);
  }

  const db = getDb();
  const index = new BM25Index();

  // Index marketplace listings (map to same shape the index expects)
  const docs = Object.values(db.listings).map((l) => ({
    id: l.id,
    title: l.title,
    slug: l.id,
    space_id: "marketplace",
    content: l.description + " " + l.content,
    tags: l.tags,
  }));

  index.index(docs);
  const results = index.search(q, 20);

  // Enrich with marketplace-specific fields
  const enriched = results.map((r) => {
    const listing = db.listings[r.id];
    return {
      ...r,
      seller_name: listing?.seller_name || "",
      price_cents: listing?.price_cents || 0,
      category: listing?.category || "",
      downloads: listing?.downloads || 0,
      description: listing?.description || "",
    };
  });

  return NextResponse.json(enriched);
}
