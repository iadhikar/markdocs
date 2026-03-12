import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

// POST: Confirm a simulated checkout (dev mode only)
export async function POST(req: NextRequest) {
  const { session_id, email } = await req.json();

  if (!session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const db = getDb();
  const order = db.orders.find(
    (o) => o.stripe_session_id === session_id && o.status === "pending"
  );

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  order.status = "completed";

  const listing = db.listings[order.listing_id];
  if (listing) listing.downloads++;

  saveDb(db);

  return NextResponse.json({
    success: true,
    listing_id: order.listing_id,
    message: "Payment confirmed (simulated). You can now download the document.",
  });
}
