"use client";

import { useState, useEffect, useRef } from "react";
import { Search, FileText, X, Download, FolderOpen, Check, Sparkles } from "lucide-react";
import { useSearch } from "@/hooks/useDocuments";
import { Space } from "@/lib/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (id: string) => void;
  spaces?: Space[];
}

export default function SearchModal({
  isOpen,
  onClose,
  onSelectDoc,
  spaces = [],
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const { results, searching, search } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showSaveFlow, setShowSaveFlow] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSavedId(null);
      setShowSaveFlow(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleDownloadMd = (result: typeof results[0]) => {
    setDownloadingId(result.id);
    // Fetch the full document content and trigger download
    fetch(`/api/documents/${result.id}`)
      .then((res) => res.json())
      .then((doc) => {
        const blob = new Blob([doc.content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${result.slug}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setDownloadingId(null);
      });
  };

  const handleSaveToSpace = async (docId: string, spaceId: string) => {
    // Fetch the doc, then create a copy in the target space
    const res = await fetch(`/api/documents/${docId}`);
    const doc = await res.json();
    const createRes = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        space_id: spaceId,
        title: doc.title + " (copy)",
        content: doc.content,
        tags: JSON.parse(doc.tags || "[]"),
      }),
    });
    const newDoc = await createRes.json();
    setSavedId(docId);
    setShowSaveFlow(null);
    setTimeout(() => {
      onSelectDoc(newDoc.id);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/40">
      <div
        className="w-[620px] rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <Sparkles size={18} style={{ color: "var(--brand)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe what you're looking for..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          <button onClick={onClose}>
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Hint */}
        {!query && (
          <div
            className="px-4 py-2 text-xs border-b"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--bg-secondary)" }}
          >
            Try prompts like &quot;how to deploy&quot;, &quot;meeting notes template&quot;, or &quot;API design guide&quot;
          </div>
        )}

        {/* Results */}
        <div className="max-h-[450px] overflow-auto">
          {searching && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Searching...
            </div>
          )}
          {!searching && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No results found for &quot;{query}&quot;
            </div>
          )}
          {!searching && results.length > 0 && (
            <div className="py-1">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="group px-4 py-3 transition-colors border-b last:border-b-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-start gap-3">
                    <FileText
                      size={16}
                      className="mt-0.5 flex-shrink-0"
                      style={{ color: "var(--brand)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { onSelectDoc(result.id); onClose(); }}
                          className="font-medium text-sm hover:underline text-left"
                        >
                          {result.title}
                        </button>
                        {result.score !== undefined && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: "var(--brand-light)", color: "var(--brand)" }}
                          >
                            {result.score}
                          </span>
                        )}
                      </div>
                      {result.snippet && (
                        <div className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                          {result.snippet}
                        </div>
                      )}
                      {result.matchedTerms && result.matchedTerms.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {result.matchedTerms.map((term) => (
                            <span
                              key={term}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {savedId === result.id ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ color: "#10b981" }}>
                          <Check size={12} /> Saved
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDownloadMd(result)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            title="Download .md file"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => setShowSaveFlow(showSaveFlow === result.id ? null : result.id)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            title="Save to a Space"
                          >
                            <FolderOpen size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Save to Space flow */}
                  {showSaveFlow === result.id && (
                    <div
                      className="mt-2 ml-7 p-3 rounded-lg border animate-fadeIn"
                      style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
                    >
                      <div className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Save a copy to:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {spaces.map((space) => (
                          <button
                            key={space.id}
                            onClick={() => handleSaveToSpace(result.id, space.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors hover:shadow-sm"
                            style={{ borderColor: "var(--border)", background: "var(--bg-primary)" }}
                          >
                            <span>{space.icon}</span>
                            <span>{space.name}</span>
                          </button>
                        ))}
                      </div>
                      <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                        The document will be copied into the selected space.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {!searching && !query && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Describe what you need in plain English. BM25-powered search will find the best matches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
