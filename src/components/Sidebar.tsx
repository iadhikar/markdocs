"use client";

import { useState } from "react";
import { Space, Document } from "@/lib/types";
import {
  FileText, Plus, Search, ChevronRight, ChevronDown, Trash2,
  Moon, Sun, BookOpen, ShoppingBag, Home, Mic, Compass,
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
  onVoiceChat?: () => void;
  onTour?: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Sidebar({
  spaces, documents, activeSpaceId, activeDocId, activeTab,
  onSelectSpace, onSelectDoc, onCreateSpace, onCreateDoc, onDeleteDoc,
  onSearch, onTabChange, onVoiceChat, onTour, darkMode, onToggleDark,
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

  const railItems = [
    { icon: Home, label: "Home", active: activeTab === "docs" && !activeDocId, onClick: () => onTabChange("docs") },
    { icon: FileText, label: "Docs", active: activeTab === "docs", onClick: () => onTabChange("docs") },
    { icon: ShoppingBag, label: "Market", active: activeTab === "marketplace", onClick: () => onTabChange("marketplace") },
    { icon: Search, label: "Search  /", active: false, onClick: onSearch },
  ];

  return (
    <div className="flex h-screen">
      {/* Icon Rail */}
      <div
        className="w-[52px] flex flex-col items-center py-3 gap-1 flex-shrink-0"
        style={{ background: "var(--bg-primary)", borderRight: "1px solid var(--border)" }}
      >
        <button
          onClick={() => onTabChange("docs")}
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all hover:scale-105"
          style={{ background: "var(--brand-solid)" }}
          title="Markdocs"
        >
          <BookOpen size={18} color="#fff" />
        </button>

        {railItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all group relative"
            style={{
              background: item.active ? "var(--brand-light)" : "transparent",
              color: item.active ? "var(--brand)" : "var(--text-muted)",
            }}
            title={item.label}
          >
            <item.icon size={18} />
            <span
              className="absolute left-12 px-2 py-1 rounded-md text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-bright)" }}
            >
              {item.label}
            </span>
          </button>
        ))}

        <div className="flex-1" />

        {onVoiceChat && (
          <button onClick={onVoiceChat} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all animate-pulse-glow" style={{ color: "var(--brand)" }} title="Voice Assistant">
            <Mic size={18} />
          </button>
        )}
        {onTour && (
          <button onClick={onTour} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all" style={{ color: "var(--text-muted)" }} title="Take a Tour">
            <Compass size={16} />
          </button>
        )}
        <button onClick={onToggleDark} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all" style={{ color: "var(--text-muted)" }} title="Toggle theme">
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Panel */}
      <div
        className="w-[210px] flex flex-col overflow-hidden"
        style={{ background: "var(--bg-secondary)", borderRight: "1px solid var(--border)" }}
      >
        <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            {activeTab === "marketplace" ? "Marketplace" : "Spaces"}
          </span>
          {activeTab === "docs" && (
            <button onClick={onCreateSpace} className="p-0.5 rounded" style={{ color: "var(--text-muted)" }} title="New Space">
              <Plus size={12} />
            </button>
          )}
        </div>

        {activeTab === "docs" && (
          <div className="flex-1 overflow-y-auto py-1.5 px-1.5">
            {spaces.map((space) => (
              <div key={space.id} className="mb-px">
                <button
                  onClick={() => toggleSpace(space.id)}
                  className="w-full flex items-center gap-1.5 px-2 py-[5px] rounded-lg text-xs transition-all"
                  style={{
                    background: activeSpaceId === space.id ? "var(--brand-light)" : "transparent",
                    color: activeSpaceId === space.id ? "var(--brand)" : "var(--text-primary)",
                  }}
                >
                  {expandedSpaces.has(space.id) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  <span>{space.icon}</span>
                  <span className="truncate font-medium">{space.name}</span>
                </button>

                {expandedSpaces.has(space.id) && activeSpaceId === space.id && (
                  <div className="ml-3 mt-px space-y-px animate-slideIn">
                    {nonTemplateDocs.map((doc) => (
                      <div key={doc.id} className="group flex items-center">
                        <button
                          onClick={() => onSelectDoc(doc.id)}
                          className="flex-1 flex items-center gap-1 px-2 py-[4px] rounded-md text-[11px] truncate transition-all"
                          style={{
                            background: activeDocId === doc.id ? "var(--brand-light)" : "transparent",
                            color: activeDocId === doc.id ? "var(--brand)" : "var(--text-secondary)",
                          }}
                        >
                          <FileText size={10} className="flex-shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteDoc(doc.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Trash2 size={9} />
                        </button>
                      </div>
                    ))}
                    <button onClick={onCreateDoc} className="flex items-center gap-1 px-2 py-[4px] rounded-md text-[11px] transition-all" style={{ color: "var(--text-muted)" }}>
                      <Plus size={10} /> New Doc
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "marketplace" && (
          <div className="flex-1 overflow-y-auto py-3 px-2.5">
            <div className="p-2.5 rounded-lg mb-2" style={{ background: "var(--bg-tertiary)" }}>
              <div className="text-[11px] font-semibold mb-0.5">MD Marketplace</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Buy and sell premium Markdown docs.</div>
            </div>
            <div className="text-[10px] space-y-1 px-1" style={{ color: "var(--text-muted)" }}>
              <div><span style={{ color: "var(--accent-green)" }}>Free</span> - instant download</div>
              <div><span style={{ color: "var(--brand)" }}>Paid</span> - Stripe checkout</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
