import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET() {
  const db = getDb();
  const spaces = Object.values(db.spaces).sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json(spaces);
}

export async function POST(req: NextRequest) {
  const { name, description, icon } = await req.json();
  const db = getDb();
  const id = nanoid(12);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  db.spaces[id] = {
    id, name, slug, description: description || null, icon: icon || "\u{1F4C1}",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };
  saveDb(db);

  return NextResponse.json(db.spaces[id], { status: 201 });
}
