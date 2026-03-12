import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const db = getDb();
  const doc = db.documents[params.docId];
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format") || "md";

  if (format === "md") {
    return new NextResponse(doc.content, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${doc.slug}.md"`,
      },
    });
  }

  if (format === "html") {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${doc.title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6}
pre{background:#f5f5f5;padding:1rem;border-radius:8px;overflow-x:auto}
code{background:#f5f5f5;padding:0.125rem 0.375rem;border-radius:4px}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}
blockquote{border-left:4px solid #ddd;margin:0;padding-left:1rem;color:#666}</style>
</head><body><h1>${doc.title}</h1><pre>${doc.content}</pre></body></html>`;
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="${doc.slug}.html"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
