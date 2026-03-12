"use client";

import { useState } from "react";
import { Space, Document } from "@/lib/types";
import {
  FileText,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Trash2,
  Moon,
  Sun,
  BookOpen,
  ShoppingBag,
} from "lucide-react";

interface SidebarProps {
  spaces: Space[];
  documents: Document[];
  activeSpaceId: string | null;
  activeDocId: string | null;
  activeTab: "docs" | "marketplace";
  onSelectSpace: (id: string) => void;
  onSelectDoc: (id: string) => void;
  onCreateSpace: () => void;
  onCreateDoc: () => void;
  onDeleteDoc: (id: string) => void;
  onSearch: () => void;
  onTabChange: (tab: "docs" | "marketplace") => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Sidebar({
  spaces,
  documents,
  activeSpaceId,
  activeDocId,
  activeTab,
  onSelectSpace,
  onSelectDoc,
  onCreateSpace,
  onCreateDoc,
  onDeleteDoc,
  onSearch,
  onTabChange,
  darkMode,
  onToggleDark,
}: SidebarProps) {
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(
    new Set(activeSpaceId ? [activeSpaceId] : [])
  );

  const toggleSpace = (id: string) => {
    const next = new Set(expandedSpaces);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSpaces(next);
    onSelectSpace(id);
  };

  const nonTemplateDocs = documents.filter((d) => !d.is_template);

  return (
    <aside
      className="h-screen flex flex-col border-r"
      style={{
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        background: "var(--bg-secondary)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-4 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <BookOpen size={24} style={{ color: "var(--brand)" }} />
        <span className="font-bold text-lg">Markdocs</span>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={() => onTabChange("docs")}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
          style={{
            borderBottom: activeTab === "docs" ? "2px solid var(--brand)" : "2px solid transparent",
            color: activeTab === "docs" ? "var(--brand)" : "var(--text-muted)",
          }}
        >
          <FileText size={14} />
          Docs
        </button>
        <button
          onClick={() => onTabChange("marketplace")}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
          style={{
            borderBottom: activeTab === "marketplace" ? "2px solid var(--brand)" : "2px solid transparent",
            color: activeTab === "marketplace" ? "var(--brand)" : "var(--text-muted)",
          }}
        >
          <ShoppingBag size={14} />
          Marketplace
        </button>
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
        style={{
          background: "var(--bg-tertiary)",
          color: "var(--text-secondary)",
        }}
      >
        <Search size={14} />
        <span>Search docs...</span>
        <kbd
          className="ml-auto text-xs px-1.5 py-0.5 rounded"
          style={{ background: "var(--bg-primary)", color: "var(--text-muted)" }}
        >
          /
        </kbd>
      </button>

      {/* Spaces & Docs */}
      {activeTab === "docs" && (
        <div className="flex-1 overflow-y-auto py-3 px-2">
          <div className="flex items-center justify-between px-2 mb-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Spaces
            </span>
            <button
              onClick={onCreateSpace}
              className="p-1 rounded hover:bg-opacity-10 transition-colors"
              style={{ color: "var(--text-muted)" }}
              title="New Space"
            >
              <Plus size={14} />
            </button>
          </div>

          {spaces.map((space) => (
            <div key={space.id} className="mb-1 animate-fadeIn">
              <button
                onClick={() => toggleSpace(space.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors hover:brightness-95"
                style={{
                  background:
                    activeSpaceId === space.id
                      ? "var(--brand-light)"
                      : "transparent",
                  color:
                    activeSpaceId === space.id
                      ? "var(--brand)"
                      : "var(--text-primary)",
                }}
              >
                {expandedSpaces.has(space.id) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
                <span>{space.icon}</span>
                <span className="truncate">{space.name}</span>
              </button>

              {expandedSpaces.has(space.id) &&
                activeSpaceId === space.id && (
                  <div className="ml-4 mt-1 space-y-0.5 animate-slideIn">
                    {nonTemplateDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="group flex items-center gap-1.5"
                      >
                        <button
                          onClick={() => onSelectDoc(doc.id)}
                          className="flex-1 flex items-center gap-1.5 px-2 py-1 rounded text-sm truncate transition-colors"
                          style={{
                            background:
                              activeDocId === doc.id
                                ? "var(--brand-light)"
                                : "transparent",
                            color:
                              activeDocId === doc.id
                                ? "var(--brand)"
                                : "var(--text-secondary)",
                          }}
                        >
                          <FileText size={13} />
                          <span className="truncate">{doc.title}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDoc(doc.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={onCreateDoc}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Plus size={13} />
                      <span>New Document</span>
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Marketplace sidebar info */}
      {activeTab === "marketplace" && (
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-3">
            <div
              className="p-3 rounded-lg border"
              style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}
            >
              <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                MD Marketplace
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Browse, buy, and sell premium Markdown documents. From API guides to runbooks.
              </div>
            </div>
            <div className="text-xs space-y-2 px-1" style={{ color: "var(--text-muted)" }}>
              <div className="flex items-center gap-2">
                <span style={{ color: "#10b981" }}>Free</span> documents can be downloaded instantly
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "var(--brand)" }}>Paid</span> documents use Stripe checkout
              </div>
              <div>
                All downloads are saved as .md files you own forever
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Markdocs v0.2
        </span>
        <button
          onClick={onToggleDark}
          className="p-1.5 rounded-md transition-colors"
          style={{ color: "var(--text-muted)" }}
          title="Toggle dark mode"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </aside>
  );
}
