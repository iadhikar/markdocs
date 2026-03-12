import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

// GET: Get a single listing (public info only, no full content unless purchased)
export async function GET(
  req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  const db = getDb();
  const listing = db.listings[params.listingId];
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check if buyer has access (via order email in query param)
  const email = req.nextUrl.searchParams.get("email");
  const hasAccess =
    listing.price_cents === 0 ||
    (email && db.orders.some(
      (o) => o.listing_id === params.listingId && o.buyer_email === email && (o.status === "completed" || o.status === "free")
    ));

  return NextResponse.json({
    id: listing.id,
    seller_name: listing.seller_name,
    title: listing.title,
    description: listing.description,
    price_cents: listing.price_cents,
    preview: listing.preview,
    content: hasAccess ? listing.content : null,
    tags: listing.tags,
    category: listing.category,
    downloads: listing.downloads,
    created_at: listing.created_at,
    has_access: !!hasAccess,
  });
}

// DELETE: Remove a listing
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  const db = getDb();
  delete db.listings[params.listingId];
  saveDb(db);
  return NextResponse.json({ ok: true });
}
