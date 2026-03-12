import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { nanoid } from "nanoid";

// POST: Create a Stripe Checkout session for a paid listing
export async function POST(req: NextRequest) {
  const { listing_id, email } = await req.json();

  if (!listing_id || !email) {
    return NextResponse.json({ error: "listing_id and email are required" }, { status: 400 });
  }

  const db = getDb();
  const listing = db.listings[listing_id];
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  if (listing.price_cents === 0) {
    return NextResponse.json({ error: "This listing is free, no payment needed" }, { status: 400 });
  }

  // Check if already purchased
  const existingOrder = db.orders.find(
    (o) => o.listing_id === listing_id && o.buyer_email === email && o.status === "completed"
  );
  if (existingOrder) {
    return NextResponse.json({ error: "Already purchased", already_purchased: true }, { status: 400 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    // Stripe not configured - simulate checkout for development
    const orderId = "ord-" + nanoid(10);
    const sessionId = "sim_" + nanoid(20);

    db.orders.push({
      id: orderId,
      listing_id,
      buyer_email: email,
      amount_cents: listing.price_cents,
      stripe_session_id: sessionId,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    saveDb(db);

    // In dev mode, return a simulated checkout URL
    return NextResponse.json({
      checkout_url: `/marketplace/checkout-sim?session=${sessionId}&listing=${listing_id}&email=${encodeURIComponent(email)}`,
      session_id: sessionId,
      mode: "simulated",
      message: "Stripe not configured. Using simulated checkout. Set STRIPE_SECRET_KEY env var for real payments.",
    });
  }

  // Real Stripe integration
  try {
    const origin = req.nextUrl.origin;
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "customer_email": email,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": String(listing.price_cents),
        "line_items[0][price_data][product_data][name]": listing.title,
        "line_items[0][price_data][product_data][description]": listing.description || "Markdown document",
        "line_items[0][quantity]": "1",
        "success_url": `${origin}/marketplace/success?session_id={CHECKOUT_SESSION_ID}&listing=${listing_id}`,
        "cancel_url": `${origin}/marketplace?cancelled=true`,
        "metadata[listing_id]": listing_id,
        "metadata[buyer_email]": email,
      }).toString(),
    });

    const session = await stripeResponse.json();

    if (session.error) {
      return NextResponse.json({ error: session.error.message }, { status: 400 });
    }

    // Create pending order
    const orderId = "ord-" + nanoid(10);
    db.orders.push({
      id: orderId,
      listing_id,
      buyer_email: email,
      amount_cents: listing.price_cents,
      stripe_session_id: session.id,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    saveDb(db);

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
      mode: "live",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
