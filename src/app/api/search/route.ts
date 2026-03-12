import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length === 0) {
    return NextResponse.json([]);
  }

  const db = getDb();
  const query = q.toLowerCase();
  const results = Object.values(db.documents)
    .filter((d) => d.is_template === 0)
    .filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.content.toLowerCase().includes(query) ||
        d.tags.toLowerCase().includes(query)
    )
    .map((d) => {
      const idx = d.content.toLowerCase().indexOf(query);
      const snippet =
        idx >= 0
          ? d.content.substring(Math.max(0, idx - 40), idx + 80)
          : d.content.substring(0, 120);
      return { id: d.id, title: d.title, slug: d.slug, space_id: d.space_id, snippet };
    })
    .sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(query) ? 0 : 1;
      const bTitle = b.title.toLowerCase().includes(query) ? 0 : 1;
      return aTitle - bTitle;
    })
    .slice(0, 20);

  return NextResponse.json(results);
}
