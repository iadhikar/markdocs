"use client";

import { useEffect, useState } from "react";
import { BookOpen, Download } from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface SharedDoc {
  id: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export default function SharedDocPage({
  params,
}: {
  params: { shareId: string };
}) {
  const [doc, setDoc] = useState<SharedDoc | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${params.shareId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setDoc(data);
        document.title = `${data.title} - Markdocs`;
        const desc = data.content.replace(/[#*_`\[\]]/g, "").substring(0, 160);
        const setMeta = (name: string, value: string, attr = "name") => {
          let tag = document.querySelector(`meta[${attr}="${name}"]`);
          if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, name); document.head.appendChild(tag); }
          tag.setAttribute("content", value);
        };
        setMeta("description", desc);
        setMeta("og:title", data.title, "property");
        setMeta("og:description", desc, "property");
        setMeta("og:type", "article", "property");
        setMeta("og:site_name", "Markdocs", "property");
      })
      .catch(() => setError(true));
  }, [params.shareId]);

  const handleDownload = () => {
    if (!doc) return;
    const blob = new Blob([doc.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Document Not Found</h1>
          <p style={{ color: "var(--text-muted)" }}>
            This share link may have been revoked or the document was deleted.
          </p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div style={{ color: "var(--text-muted)" }}>Loading...</div>
      </div>
    );
  }

  const tags = (() => { try { return JSON.parse(doc.tags); } catch { return []; } })();
  const wordCount = doc.content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <BookOpen size={20} style={{ color: "var(--brand)" }} />
          <span className="font-semibold">Markdocs</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>Shared</span>
          <div className="flex-1" />
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--brand)", color: "#fff" }}>
            <Download size={13} /> Download .md
          </button>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
        <div className="flex items-center gap-4 mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
          <span>{readTime} min read</span>
          <span>{wordCount} words</span>
          <span>Updated {new Date(doc.updated_at).toLocaleDateString()}</span>
          {tags.length > 0 && (
            <div className="flex gap-1">
              {tags.map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        <MarkdownRenderer content={doc.content} showToc={true} />
      </article>

      <footer className="border-t mt-12" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Shared via Markdocs -- Markdown-first documentation platform
        </div>
      </footer>
    </div>
  );
}
