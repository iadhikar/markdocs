"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X, ChevronRight, ChevronLeft, Sparkles, Search, ShoppingBag,
  FileText, Share2, Star, BookOpen, Download, Eye, Columns,
  Tag, Clock, BarChart3, Zap, Globe,
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector to highlight
  position: "center" | "left" | "right" | "bottom-left" | "bottom-right";
  tag?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Markdocs",
    description: "The Confluence-like platform built exclusively for Markdown files. Zero friction. No lock-in. Your files are just .md — forever portable.",
    icon: <BookOpen size={28} />,
    position: "center",
    tag: "START",
  },
  {
    title: "Smart Prompt Search",
    description: "Press / anywhere to search. Unlike keyword matching, our BM25 engine understands your intent. Try \"how to deploy services\" or \"API design best practices\" — it ranks results by relevance, not just string matching.",
    icon: <Sparkles size={28} />,
    position: "center",
    tag: "UNIQUE",
  },
  {
    title: "Split-Pane Editor",
    description: "Write in markdown on the left, see it rendered live on the right. Three modes: Edit, Split, and Preview. Auto-saves every 2 seconds. Ctrl+S for instant save.",
    icon: <Columns size={28} />,
    position: "center",
  },
  {
    title: "Wiki-Style Linking",
    description: "Type [[Page Name]] to create links between documents — just like Wikipedia. Click any wiki link to navigate instantly. Build a connected knowledge graph.",
    icon: <Zap size={28} />,
    position: "center",
    tag: "UNIQUE",
  },
  {
    title: "One-Click Sharing",
    description: "Hit the Share button on any document to get a public link instantly. Anyone can view the beautifully rendered page — no account needed. Revoke anytime.",
    icon: <Share2 size={28} />,
    position: "center",
  },
  {
    title: "Mermaid Diagrams",
    description: "Write diagrams as code using ```mermaid blocks. Flowcharts, sequence diagrams, ER diagrams — all rendered live in the preview. No more \"Doc-Rot\" from outdated images.",
    icon: <Eye size={28} />,
    position: "center",
    tag: "UNIQUE",
  },
  {
    title: "MD Marketplace",
    description: "Buy and sell premium Markdown documents. Engineering guides, runbooks, templates, checklists — browse by category, search with BM25, preview before you buy. Stripe-powered payments.",
    icon: <ShoppingBag size={28} />,
    position: "center",
    tag: "EXCLUSIVE",
  },
  {
    title: "Download & Save Anywhere",
    description: "Every search result and marketplace item can be downloaded as a .md file or saved directly into any of your Spaces. You choose where it goes — total control over your knowledge.",
    icon: <Download size={28} />,
    position: "center",
  },
  {
    title: "Templates Library",
    description: "Start from battle-tested templates: Meeting Notes, RFCs, Architecture Decision Records, Runbooks. Create documents from templates in one click.",
    icon: <FileText size={28} />,
    position: "center",
  },
  {
    title: "Version History",
    description: "Every save creates a version snapshot. Browse your document's complete history and see how it evolved over time. Never lose work again.",
    icon: <Clock size={28} />,
    position: "center",
  },
  {
    title: "AI-Ready (llms.txt)",
    description: "Markdocs exposes a /api/llms.txt endpoint following the new web standard — making your shared documents discoverable by AI agents like Claude, ChatGPT, and Copilot. Your docs work for humans AND machines.",
    icon: <Globe size={28} />,
    position: "center",
    tag: "EXCLUSIVE",
  },
  {
    title: "Tags, Favorites & Analytics",
    description: "Tag documents for easy filtering. Star your favorites. See view counts, word counts, and reading time estimates. Know which docs matter most.",
    icon: <BarChart3 size={28} />,
    position: "center",
  },
  {
    title: "Import & Export",
    description: "Import .md files via API (drag-drop coming soon). Export any document as Markdown or HTML. Bulk import from Obsidian, Notion exports, or any folder of .md files.",
    icon: <Tag size={28} />,
    position: "center",
  },
  {
    title: "Dark Mode & Keyboard Shortcuts",
    description: "Toggle dark mode from the sidebar. Keyboard-first: / for search, Ctrl+S to save, Ctrl+N for new doc. Built for speed.",
    icon: <Star size={28} />,
    position: "center",
  },
  {
    title: "You're Ready!",
    description: "Start by creating a document, searching for something, or exploring the Marketplace. Press / anytime to search. Click the Marketplace tab to browse premium content.",
    icon: <Sparkles size={28} />,
    position: "center",
    tag: "GO",
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
}

export default function GuidedTour({ isOpen, onClose, onAction }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, step, onClose]);

  const goNext = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) {
      onClose();
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setAnimating(false);
    }, 150);
  }, [step, onClose]);

  const goPrev = useCallback(() => {
    if (step <= 0) return;
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimating(false);
    }, 150);
  }, [step]);

  if (!isOpen) return null;

  const current = TOUR_STEPS[step];
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Tour Card */}
      <div
        className={`relative w-[520px] rounded-2xl shadow-2xl overflow-hidden transition-all duration-150 ${animating ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Progress bar */}
        <div className="h-1" style={{ background: "var(--bg-tertiary)" }}>
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "var(--brand)" }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md z-10"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="px-8 pt-8 pb-6">
          {/* Icon + Tag */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-3 rounded-xl"
              style={{ background: "var(--brand-light)", color: "var(--brand)" }}
            >
              {current.icon}
            </div>
            {current.tag && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                style={{
                  background: current.tag === "EXCLUSIVE" ? "#7c3aed" :
                    current.tag === "UNIQUE" ? "#0ea5e9" :
                    current.tag === "GO" ? "#10b981" : "var(--brand)",
                  color: "#fff",
                }}
              >
                {current.tag}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold mb-2">{current.title}</h2>

          {/* Description */}
          <p
            className="text-sm leading-relaxed mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            {current.description}
          </p>

          {/* Step indicator dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAnimating(true); setTimeout(() => { setStep(i); setAnimating(false); }, 150); }}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  background: i === step ? "var(--brand)" : i < step ? "var(--brand)" : "var(--border)",
                  opacity: i <= step ? 1 : 0.5,
                }}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={goPrev}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className="text-xs mr-2"
                style={{ color: "var(--text-muted)" }}
              >
                {step + 1} / {TOUR_STEPS.length}
              </span>
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Skip tour
              </button>
              <button
                onClick={goNext}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "var(--brand)", color: "#fff" }}
              >
                {step === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
                {step < TOUR_STEPS.length - 1 && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
