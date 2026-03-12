"use client";

import { BookOpen, FileText, Search, Share2, Layout, Tag } from "lucide-react";

interface WelcomeViewProps {
  onCreateDoc: () => void;
  onSearch: () => void;
  recentDocs: { id: string; title: string; updated_at: string }[];
  onSelectDoc: (id: string) => void;
}

export default function WelcomeView({
  onCreateDoc,
  onSearch,
  recentDocs,
  onSelectDoc,
}: WelcomeViewProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "var(--brand-light)" }}
          >
            <BookOpen size={32} style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Markdocs</h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Your Markdown-first documentation platform
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <button
            onClick={onCreateDoc}
            className="flex items-center gap-4 p-5 rounded-xl border text-left transition-all hover:shadow-md"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-secondary)",
            }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ background: "var(--brand-light)" }}
            >
              <FileText size={20} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <div className="font-semibold text-sm">New Document</div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Start writing from scratch or a template
              </div>
            </div>
          </button>

          <button
            onClick={onSearch}
            className="flex items-center gap-4 p-5 rounded-xl border text-left transition-all hover:shadow-md"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-secondary)",
            }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ background: "var(--brand-light)" }}
            >
              <Search size={20} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <div className="font-semibold text-sm">Search Docs</div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Find anything across all spaces
              </div>
            </div>
          </button>
        </div>

        {/* Features */}
        <h2 className="text-lg font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-3 gap-3 mb-12">
          {[
            {
              icon: Layout,
              title: "Split Editor",
              desc: "Write and preview side by side",
            },
            {
              icon: Share2,
              title: "One-click Share",
              desc: "Public links in seconds",
            },
            {
              icon: Tag,
              title: "Tags & Search",
              desc: "Find anything instantly",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-4 rounded-xl border"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
              }}
            >
              <Icon
                size={18}
                className="mb-2"
                style={{ color: "var(--brand)" }}
              />
              <div className="font-medium text-sm">{title}</div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {desc}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Docs */}
        {recentDocs.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-4">Recent Documents</h2>
            <div className="space-y-2">
              {recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <FileText size={16} style={{ color: "var(--brand)" }} />
                  <span className="flex-1 font-medium text-sm">
                    {doc.title}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
