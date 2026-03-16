"use client";

import {
  BookOpen, FileText, Search, Share2, ShoppingBag, Mic,
  Compass, Sparkles, Zap, Globe, Star, ArrowRight,
} from "lucide-react";

interface WelcomeViewProps {
  onCreateDoc: () => void;
  onSearch: () => void;
  onTakeTour?: () => void;
  onMarketplace?: () => void;
  onVoiceChat?: () => void;
  recentDocs: { id: string; title: string; updated_at: string }[];
  onSelectDoc: (id: string) => void;
}

export default function WelcomeView({
  onCreateDoc, onSearch, onTakeTour, onMarketplace, onVoiceChat,
  recentDocs, onSelectDoc,
}: WelcomeViewProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Hero */}
        <div
          className="relative rounded-2xl p-8 mb-6 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--brand-solid) 0%, #7c3aed 50%, #ec4899 100%)",
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={24} color="#fff" />
              <span className="text-white text-lg font-bold">Markdocs</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">v0.3</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Your markdown, supercharged.</h1>
            <p className="text-sm text-white/70 max-w-lg">
              Write, search, share, and sell Markdown documents. Voice-controlled. AI-ready. Zero lock-in.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={onCreateDoc}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white text-indigo-600 transition-all hover:scale-105"
              >
                <FileText size={14} /> New Document
              </button>
              <button
                onClick={onSearch}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white/15 text-white border border-white/20 transition-all hover:bg-white/25"
              >
                <Sparkles size={14} /> Search with AI
              </button>
              {onVoiceChat && (
                <button
                  onClick={onVoiceChat}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white/15 text-white border border-white/20 transition-all hover:bg-white/25"
                >
                  <Mic size={14} /> Voice Mode
                </button>
              )}
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-[-40px] right-[-40px] w-[200px] h-[200px] rounded-full bg-white/5" />
          <div className="absolute bottom-[-60px] right-[100px] w-[150px] h-[150px] rounded-full bg-white/5" />
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: FileText, label: "New Doc", desc: "Blank or template", onClick: onCreateDoc, color: "var(--brand)" },
            { icon: Search, label: "Search", desc: "Press / anywhere", onClick: onSearch, color: "#0ea5e9" },
            { icon: ShoppingBag, label: "Marketplace", desc: "Buy & sell docs", onClick: onMarketplace, color: "#8b5cf6" },
            { icon: Mic, label: "Voice", desc: "Hands-free mode", onClick: onVoiceChat, color: "#10b981" },
          ].map(({ icon: Icon, label, desc, onClick, color }) => (
            <button
              key={label}
              onClick={onClick}
              className="glow-card p-4 rounded-xl text-left transition-all group"
              style={{ background: "var(--bg-secondary)" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ background: `${color}15`, color }}>
                <Icon size={16} />
              </div>
              <div className="text-xs font-semibold mb-0.5">{label}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{desc}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Recent Docs */}
          <div className="col-span-2 rounded-xl p-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Recent Documents</span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{recentDocs.length} docs</span>
            </div>
            {recentDocs.length > 0 ? (
              <div className="space-y-1">
                {recentDocs.slice(0, 5).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDoc(doc.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all glow-card"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    <FileText size={12} style={{ color: "var(--brand)" }} className="flex-shrink-0" />
                    <span className="flex-1 text-xs font-medium truncate">{doc.title}</span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {new Date(doc.updated_at).toLocaleDateString()}
                    </span>
                    <ArrowRight size={10} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>
                No documents yet. Create your first one!
              </div>
            )}
          </div>

          {/* Feature Highlights */}
          <div className="space-y-3">
            {[
              { icon: Sparkles, label: "BM25 Search", desc: "Natural language queries", color: "#0ea5e9" },
              { icon: Zap, label: "Wiki Links", desc: "[[Page]] cross-refs", color: "#f59e0b" },
              { icon: Globe, label: "AI Ready", desc: "llms.txt endpoint", color: "#10b981" },
              { icon: Star, label: "Mermaid", desc: "Diagrams as code", color: "#ec4899" },
            ].map(({ icon: Icon, label, desc, color }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 p-2.5 rounded-xl"
                style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
                  <Icon size={13} />
                </div>
                <div>
                  <div className="text-xs font-semibold">{label}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tour Banner */}
        {onTakeTour && (
          <button
            onClick={onTakeTour}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all glow-card"
            style={{ background: "var(--bg-secondary)" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--brand-light)" }}>
              <Compass size={16} style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold">Take a Tour</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                15-step walkthrough of every feature including voice assistant, marketplace, and BM25 search
              </div>
            </div>
            <ArrowRight size={14} style={{ color: "var(--text-muted)" }} />
          </button>
        )}
      </div>
    </div>
  );
}
