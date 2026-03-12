import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

// POST: Stripe webhook - called when payment completes
export async function POST(req: NextRequest) {
  const body = await req.text();

  // In production, verify the webhook signature with STRIPE_WEBHOOK_SECRET
  // For now, parse the event directly
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const sessionId = session.id;
    const listingId = session.metadata?.listing_id;
    const buyerEmail = session.metadata?.buyer_email || session.customer_email;

    const db = getDb();

    // Find and update the pending order
    const order = db.orders.find(
      (o) => o.stripe_session_id === sessionId && o.status === "pending"
    );

    if (order) {
      order.status = "completed";

      // Increment download count
      const listing = db.listings[order.listing_id];
      if (listing) listing.downloads++;

      saveDb(db);
    }
  }

  return NextResponse.json({ received: true });
}
