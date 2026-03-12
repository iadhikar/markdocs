import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET: llms.txt - AI-readable index of all public documents
// Following the llms.txt standard (llmstxt.org)
export async function GET() {
  const db = getDb();
  const docs = Object.values(db.documents).filter(
    (d) => d.is_template === 0 && d.share_id
  );
  const spaces = Object.values(db.spaces);

  let content = `# Markdocs\n\n`;
  content += `> Markdown-first documentation platform with search, sharing, and marketplace.\n\n`;

  for (const space of spaces) {
    const spaceDocs = docs.filter((d) => d.space_id === space.id);
    if (spaceDocs.length === 0) continue;

    content += `## ${space.icon} ${space.name}\n\n`;
    for (const doc of spaceDocs) {
      content += `- [${doc.title}](/api/share/${doc.share_id}): ${doc.content.substring(0, 100).replace(/\n/g, " ").trim()}\n`;
    }
    content += `\n`;
  }

  // Also list marketplace items
  const listings = Object.values(db.listings);
  if (listings.length > 0) {
    content += `## Marketplace\n\n`;
    for (const l of listings) {
      const price = l.price_cents === 0 ? "Free" : `$${(l.price_cents / 100).toFixed(2)}`;
      content += `- [${l.title}](/api/marketplace/${l.id}) (${price}): ${l.description.substring(0, 100).trim()}\n`;
    }
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
