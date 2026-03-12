import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { nanoid } from "nanoid";

// GET: List all marketplace listings
export async function GET(req: NextRequest) {
  const db = getDb();
  const category = req.nextUrl.searchParams.get("category");
  const sort = req.nextUrl.searchParams.get("sort") || "newest";

  let listings = Object.values(db.listings);

  if (category && category !== "all") {
    listings = listings.filter((l) => l.category === category);
  }

  // Don't expose full content in listing view
  const publicListings = listings.map((l) => ({
    id: l.id,
    seller_name: l.seller_name,
    title: l.title,
    description: l.description,
    price_cents: l.price_cents,
    preview: l.preview,
    tags: l.tags,
    category: l.category,
    downloads: l.downloads,
    created_at: l.created_at,
  }));

  switch (sort) {
    case "price-low":
      publicListings.sort((a, b) => a.price_cents - b.price_cents);
      break;
    case "price-high":
      publicListings.sort((a, b) => b.price_cents - a.price_cents);
      break;
    case "popular":
      publicListings.sort((a, b) => b.downloads - a.downloads);
      break;
    default:
      publicListings.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  return NextResponse.json(publicListings);
}

// POST: Create a new listing (sell an MD file)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { seller_name, title, description, content, price_cents, tags, category } = body;

  if (!title || !content || !seller_name) {
    return NextResponse.json({ error: "title, content, and seller_name are required" }, { status: 400 });
  }

  const db = getDb();
  const id = "lst-" + nanoid(10);
  const now = new Date().toISOString();

  db.listings[id] = {
    id,
    seller_name,
    title,
    description: description || "",
    price_cents: price_cents || 0,
    content,
    preview: content.substring(0, 200) + (content.length > 200 ? "..." : ""),
    tags: JSON.stringify(tags || []),
    category: category || "general",
    downloads: 0,
    created_at: now,
    updated_at: now,
  };
  saveDb(db);

  return NextResponse.json({ id, title, price_cents: price_cents || 0 }, { status: 201 });
}
