"use client";

import { useState, useEffect, useRef } from "react";
import { Search, FileText, X } from "lucide-react";
import { useSearch } from "@/hooks/useDocuments";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (id: string) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  onSelectDoc,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const { results, searching, search } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        // This would need to be handled by parent, but we handle Escape here
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40">
      <div
        className="w-[560px] rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <Search size={18} style={{ color: "var(--text-muted)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all documents..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          <button onClick={onClose}>
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-auto">
          {searching && (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Searching...
            </div>
          )}
          {!searching && query && results.length === 0 && (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No results found for &quot;{query}&quot;
            </div>
          )}
          {!searching && results.length > 0 && (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    onSelectDoc(result.id);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:brightness-95"
                  style={{ background: "transparent" }}
                >
                  <FileText
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: "var(--brand)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{result.title}</div>
                    {result.snippet && (
                      <div
                        className="text-xs mt-0.5 truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {result.snippet}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {!searching && !query && (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Start typing to search across all documents
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
