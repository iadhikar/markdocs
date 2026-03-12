"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
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
      .then(setDoc)
      .catch(() => setError(true));
  }, [params.shareId]);

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

  const tags = (() => {
    try {
      return JSON.parse(doc.tags);
    } catch {
      return [];
    }
  })();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header
        className="border-b"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <BookOpen size={20} style={{ color: "var(--brand)" }} />
          <span className="font-semibold">Markdocs</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: "var(--brand-light)",
              color: "var(--brand)",
            }}
          >
            Shared
          </span>
        </div>
      </header>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">{doc.title}</h1>
        <div
          className="flex items-center gap-4 mb-6 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <span>
            Updated {new Date(doc.updated_at).toLocaleDateString()}
          </span>
          {tags.length > 0 && (
            <div className="flex gap-1">
              {tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{
                    background: "var(--brand-light)",
                    color: "var(--brand)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <MarkdownRenderer content={doc.content} />
      </article>

      {/* Footer */}
      <footer
        className="border-t mt-12"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="max-w-4xl mx-auto px-6 py-4 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Shared via Markdocs — Markdown-first documentation platform
        </div>
      </footer>
    </div>
  );
}
