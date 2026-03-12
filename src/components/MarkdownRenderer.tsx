"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { useCallback, useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  onWikiLinkClick?: (pageName: string) => void;
}

export default function MarkdownRenderer({
  content,
  onWikiLinkClick,
}: MarkdownRendererProps) {
  // Process wiki-style links [[Page Name]] before rendering
  const processedContent = useMemo(() => {
    return content.replace(
      /\[\[([^\]]+)\]\]/g,
      (_, pageName) =>
        `<a class="wiki-link" data-wiki-link="${pageName}">${pageName}</a>`
    );
  }, [content]);

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
    <div className="prose-md" onClick={handleClick}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSlug]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
