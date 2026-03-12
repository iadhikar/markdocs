import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const db = getDb();
  const spaceId = req.nextUrl.searchParams.get("spaceId");
  const templateOnly = req.nextUrl.searchParams.get("templates");
  const docs = Object.values(db.documents);

  if (templateOnly) {
    return NextResponse.json(
      docs.filter((d) => d.is_template === 1).sort((a, b) => a.title.localeCompare(b.title))
    );
  }

  if (spaceId) {
    return NextResponse.json(
      docs
        .filter((d) => d.space_id === spaceId && d.is_template === 0)
        .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
    );
  }

  return NextResponse.json(
    docs
      .filter((d) => d.is_template === 0)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 50)
  );
}

export async function POST(req: NextRequest) {
  const { space_id, title, content, parent_id, tags, template_id } = await req.json();
  const db = getDb();

  let docContent = content || "";
  if (template_id && db.documents[template_id]) {
    docContent = db.documents[template_id].content;
  }

  const id = nanoid(12);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const now = new Date().toISOString();

  db.documents[id] = {
    id, space_id, title, slug, content: docContent,
    parent_id: parent_id || null, position: 0,
    tags: JSON.stringify(tags || []), share_id: null,
    is_template: 0, template_name: null,
    created_at: now, updated_at: now,
  };
  saveDb(db);

  return NextResponse.json(db.documents[id], { status: 201 });
}
