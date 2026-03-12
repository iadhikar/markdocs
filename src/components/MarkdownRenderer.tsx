"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { useCallback, useMemo, useEffect, useRef } from "react";

interface MarkdownRendererProps {
  content: string;
  onWikiLinkClick?: (pageName: string) => void;
  showToc?: boolean;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`\[\]]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    items.push({ id, text, level });
  }
  return items;
}

export default function MarkdownRenderer({
  content,
  onWikiLinkClick,
  showToc = false,
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Process wiki-style links [[Page Name]] before rendering
  const processedContent = useMemo(() => {
    return content.replace(
      /\[\[([^\]]+)\]\]/g,
      (_, pageName) =>
        `<a class="wiki-link" data-wiki-link="${pageName}">${pageName}</a>`
    );
  }, [content]);

  const toc = useMemo(() => (showToc ? extractToc(content) : []), [content, showToc]);

  // Render Mermaid diagrams after content changes
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const codeBlocks = containerRef.current.querySelectorAll("code.language-mermaid");
    if (codeBlocks.length === 0) return;

    const renderMermaid = () => {
      if (!(window as any).mermaid) return;
      (window as any).mermaid.initialize({ startOnLoad: false, theme: "default" });
      codeBlocks.forEach((block) => {
        const pre = block.parentElement;
        if (!pre || pre.getAttribute("data-mermaid-done")) return;
        pre.setAttribute("data-mermaid-done", "true");
        const div = document.createElement("div");
        div.className = "mermaid";
        div.textContent = block.textContent || "";
        pre.replaceWith(div);
      });
      (window as any).mermaid.run();
    };

    if ((window as any).mermaid) {
      renderMermaid();
    } else {
      const existing = document.querySelector('script[src*="mermaid"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
        script.onload = renderMermaid;
        document.head.appendChild(script);
      }
    }
  }, [processedContent]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("wiki-link")) {
        e.preventDefault();
        const pageName = target.getAttribute("data-wiki-link");
        if (pageName && onWikiLinkClick) {
          onWikiLinkClick(pageName);
        }
      }
    },
    [onWikiLinkClick]
  );

  return (
    <div className="flex gap-6">
      <div ref={containerRef} className="prose-md flex-1 min-w-0" onClick={handleClick}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeSlug]}
        >
          {processedContent}
        </ReactMarkdown>
      </div>

      {/* Table of Contents */}
      {showToc && toc.length > 2 && (
        <nav
          className="hidden xl:block w-52 flex-shrink-0 sticky top-0 self-start pt-4"
          style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            On this page
          </div>
          <ul className="space-y-1">
            {toc.map((item, i) => (
              <li key={i}>
                <a
                  href={`#${item.id}`}
                  className="block text-xs py-0.5 transition-colors hover:underline"
                  style={{
                    color: "var(--text-muted)",
                    paddingLeft: `${(item.level - 1) * 12}px`,
                  }}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
