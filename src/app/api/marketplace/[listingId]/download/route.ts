import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { nanoid } from "nanoid";

// POST: Download/acquire a listing (free or after payment)
export async function POST(
  req: NextRequest,
  { params }: { params: { listingId: string } }
) {
  const db = getDb();
  const listing = db.listings[params.listingId];
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { email, space_id } = await req.json();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  // For free listings, grant access immediately
  if (listing.price_cents === 0) {
    // Check if already downloaded
    const existingOrder = db.orders.find(
      (o) => o.listing_id === params.listingId && o.buyer_email === email
    );

    if (!existingOrder) {
      db.orders.push({
        id: "ord-" + nanoid(10),
        listing_id: params.listingId,
        buyer_email: email,
        amount_cents: 0,
        stripe_session_id: null,
        status: "free",
        created_at: new Date().toISOString(),
      });
      listing.downloads++;
    }

    // If space_id provided, save to user's space
    let savedDocId: string | null = null;
    if (space_id) {
      const docId = nanoid(12);
      const slug = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      db.documents[docId] = {
        id: docId,
        space_id,
        title: listing.title,
        slug: slug + "-" + nanoid(4),
        content: listing.content,
        parent_id: null,
        position: 0,
        tags: listing.tags,
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      savedDocId = docId;
    }

    saveDb(db);

    return NextResponse.json({
      success: true,
      content: listing.content,
      saved_doc_id: savedDocId,
    });
  }

  // For paid listings, check if already purchased
  const existingOrder = db.orders.find(
    (o) =>
      o.listing_id === params.listingId &&
      o.buyer_email === email &&
      o.status === "completed"
  );

  if (existingOrder) {
    // Already purchased, allow re-download
    let savedDocId: string | null = null;
    if (space_id) {
      const docId = nanoid(12);
      const slug = listing.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      db.documents[docId] = {
        id: docId,
        space_id,
        title: listing.title,
        slug: slug + "-" + nanoid(4),
        content: listing.content,
        parent_id: null,
        position: 0,
        tags: listing.tags,
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      savedDocId = docId;
      saveDb(db);
    }

    return NextResponse.json({
      success: true,
      content: listing.content,
      saved_doc_id: savedDocId,
    });
  }

  // Not purchased yet - need to go through checkout
  return NextResponse.json(
    { error: "Payment required", checkout_url: `/api/marketplace/checkout?listing=${params.listingId}&email=${encodeURIComponent(email)}` },
    { status: 402 }
  );
}
