"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MarkdownRenderer from "./MarkdownRenderer";
import {
  Save,
  Eye,
  Edit3,
  Columns,
  Share2,
  Download,
  Tag,
  Clock,
  Copy,
  Check,
  X,
  Link,
} from "lucide-react";

const CodeMirrorEditor = dynamic(() => import("./CodeMirrorEditor"), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-full"
      style={{ color: "var(--text-muted)" }}
    >
      Loading editor...
    </div>
  ),
});

interface EditorProps {
  docId: string;
  title: string;
  content: string;
  tags: string[];
  shareId: string | null;
  onSave: (updates: { title?: string; content?: string; tags?: string[] }) => Promise<void>;
  onShare: () => Promise<string | null>;
  onUnshare: () => Promise<void>;
  onWikiLinkClick?: (pageName: string) => void;
}

type ViewMode = "edit" | "preview" | "split";

export default function Editor({
  docId,
  title: initialTitle,
  content: initialContent,
  tags: initialTags,
  shareId,
  onSave,
  onShare,
  onUnshare,
  onWikiLinkClick,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<
    { id: number; title: string; created_at: string }[]
  >([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasChanges = useRef(false);

  // Reset state when doc changes
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags);
    hasChanges.current = false;
  }, [docId, initialTitle, initialContent, initialTags]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await onSave({ title, content, tags });
    setSaving(false);
    setSaved(true);
    hasChanges.current = false;
    setTimeout(() => setSaved(false), 2000);
  }, [title, content, tags, onSave]);

  // Auto-save after 2 seconds of inactivity
  const scheduleAutoSave = useCallback(() => {
    hasChanges.current = true;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (hasChanges.current) handleSave();
    }, 2000);
  }, [handleSave]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const handleContentChange = (val: string) => {
    setContent(val);
    scheduleAutoSave();
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    scheduleAutoSave();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput("");
      onSave({ tags: newTags });
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    onSave({ tags: newTags });
  };

  const handleShare = async () => {
    if (shareId) {
      setShowShareModal(true);
    } else {
      await onShare();
      setShowShareModal(true);
    }
  };

  const copyShareLink = () => {
    if (shareId) {
      navigator.clipboard.writeText(`${window.location.origin}/share/${shareId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const loadVersions = async () => {
    const res = await fetch(`/api/documents/${docId}/versions`);
    const data = await res.json();
    setVersions(data);
    setShowVersions(true);
  };

  const exportDoc = (format: string) => {
    window.open(`/api/documents/${docId}/export?format=${format}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
      >
        {/* View Mode Buttons */}
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: "var(--border)" }}
        >
          {([
            { mode: "edit" as ViewMode, icon: Edit3, label: "Edit" },
            { mode: "split" as ViewMode, icon: Columns, label: "Split" },
            { mode: "preview" as ViewMode, icon: Eye, label: "Preview" },
          ] as const).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  viewMode === mode ? "var(--brand)" : "var(--bg-primary)",
                color: viewMode === mode ? "#fff" : "var(--text-secondary)",
              }}
              title={label}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Tags */}
        <button
          onClick={() => setShowTagInput(!showTagInput)}
          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <Tag size={13} />
          Tags ({tags.length})
        </button>

        {/* Version History */}
        <button
          onClick={loadVersions}
          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          <Clock size={13} />
          History
        </button>

        {/* Export */}
        <div className="relative group">
          <button
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <Download size={13} />
            Export
          </button>
          <div
            className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-lg border hidden group-hover:block z-10"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border)",
              minWidth: "120px",
            }}
          >
            <button
              onClick={() => exportDoc("md")}
              className="w-full px-3 py-1.5 text-left text-sm hover:brightness-95"
            >
              Markdown (.md)
            </button>
            <button
              onClick={() => exportDoc("html")}
              className="w-full px-3 py-1.5 text-left text-sm hover:brightness-95"
            >
              HTML (.html)
            </button>
          </div>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: shareId ? "#10b981" : "var(--brand)",
            color: "#fff",
          }}
        >
          <Share2 size={13} />
          {shareId ? "Shared" : "Share"}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: "var(--brand)", color: "#fff" }}
          disabled={saving}
        >
          {saved ? <Check size={13} /> : <Save size={13} />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save"}
        </button>
      </div>

      {/* Tag Bar */}
      {showTagInput && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-b animate-fadeIn"
          style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{ background: "var(--brand-light)", color: "var(--brand)" }}
            >
              {tag}
              <button onClick={() => removeTag(tag)}>
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="Add tag..."
            className="px-2 py-0.5 text-xs rounded border outline-none"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      )}

      {/* Title */}
      <div className="px-6 pt-4">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full text-2xl font-bold outline-none bg-transparent"
          style={{ color: "var(--text-primary)" }}
          placeholder="Untitled Document"
        />
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden flex">
        {(viewMode === "edit" || viewMode === "split") && (
          <div
            className={`overflow-auto ${viewMode === "split" ? "w-1/2 border-r" : "w-full"}`}
            style={{ borderColor: "var(--border)" }}
          >
            <CodeMirrorEditor value={content} onChange={handleContentChange} />
          </div>
        )}
        {(viewMode === "preview" || viewMode === "split") && (
          <div
            className={`overflow-auto p-6 ${viewMode === "split" ? "w-1/2" : "w-full max-w-4xl mx-auto"}`}
          >
            <MarkdownRenderer
              content={content}
              onWikiLinkClick={onWikiLinkClick}
            />
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="rounded-xl shadow-2xl p-6 w-[420px] animate-fadeIn"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Share Document</h3>
              <button onClick={() => setShowShareModal(false)}>
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            {shareId ? (
              <>
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Anyone with this link can view this document:
                </p>
                <div
                  className="flex items-center gap-2 p-2 rounded-lg border"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border)",
                  }}
                >
                  <Link size={14} style={{ color: "var(--text-muted)" }} />
                  <span className="flex-1 text-sm truncate">
                    {window.location.origin}/share/{shareId}
                  </span>
                  <button
                    onClick={copyShareLink}
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ background: "var(--brand)", color: "#fff" }}
                  >
                    {copied ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <button
                  onClick={async () => {
                    await onUnshare();
                    setShowShareModal(false);
                  }}
                  className="mt-4 w-full py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={{
                    borderColor: "#ef4444",
                    color: "#ef4444",
                  }}
                >
                  Revoke Share Link
                </button>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Generating share link...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="rounded-xl shadow-2xl p-6 w-[500px] max-h-[600px] overflow-auto animate-fadeIn"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Version History</h3>
              <button onClick={() => setShowVersions(false)}>
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            {versions.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No previous versions yet. Versions are created each time you
                save.
              </p>
            ) : (
              <div className="space-y-2">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-lg border"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{v.title}</span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(v.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
