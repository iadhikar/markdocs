import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { nanoid } from "nanoid";

// POST: Import one or more markdown files into a space
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { space_id, files } = body;

  if (!space_id || !files || !Array.isArray(files)) {
    return NextResponse.json(
      { error: "space_id and files[] are required" },
      { status: 400 }
    );
  }

  const db = getDb();
  const imported: { id: string; title: string }[] = [];
  const now = new Date().toISOString();

  for (const file of files) {
    const { name, content } = file;
    if (!name || !content) continue;

    // Extract title from first heading or filename
    const headingMatch = content.match(/^#\s+(.+)$/m);
    const title = headingMatch
      ? headingMatch[1].trim()
      : name.replace(/\.md$/i, "").replace(/[-_]/g, " ");

    const id = nanoid(12);
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") +
      "-" +
      nanoid(4);

    // Try to extract tags from frontmatter
    let tags: string[] = [];
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const tagsLine = fmMatch[1]
        .split("\n")
        .find((l: string) => l.startsWith("tags:"));
      if (tagsLine) {
        const tagStr = tagsLine.replace("tags:", "").trim();
        try {
          tags = JSON.parse(tagStr);
        } catch {
          tags = tagStr
            .replace(/[\[\]]/g, "")
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean);
        }
      }
    }

    db.documents[id] = {
      id,
      space_id,
      title,
      slug,
      content,
      parent_id: null,
      position: 0,
      tags: JSON.stringify(tags),
      share_id: null,
      is_template: 0,
      template_name: null,
      views: 0,
      is_favorite: 0,
      created_at: now,
      updated_at: now,
    };

    imported.push({ id, title });
  }

  saveDb(db);

  return NextResponse.json(
    { imported, count: imported.length },
    { status: 201 }
  );
}
