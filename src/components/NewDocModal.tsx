"use client";

import { useState, useEffect, useRef } from "react";
import { X, FileText, Layout } from "lucide-react";
import { useTemplates } from "@/hooks/useDocuments";

interface NewDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, templateId?: string) => void;
}

export default function NewDocModal({
  isOpen,
  onClose,
  onCreate,
}: NewDocModalProps) {
  const [title, setTitle] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(
    undefined
  );
  const templates = useTemplates();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setSelectedTemplate(undefined);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (title.trim()) {
      onCreate(title.trim(), selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-[480px] rounded-xl shadow-2xl p-6 animate-fadeIn"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">New Document</h3>
          <button onClick={onClose}>
            <X size={18} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Title
            </label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="My awesome document"
              className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Start from template (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedTemplate(undefined)}
                className="flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors"
                style={{
                  borderColor:
                    selectedTemplate === undefined
                      ? "var(--brand)"
                      : "var(--border)",
                  background:
                    selectedTemplate === undefined
                      ? "var(--brand-light)"
                      : "var(--bg-secondary)",
                }}
              >
                <FileText size={16} />
                Blank Document
              </button>
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className="flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors"
                  style={{
                    borderColor:
                      selectedTemplate === tpl.id
                        ? "var(--brand)"
                        : "var(--border)",
                    background:
                      selectedTemplate === tpl.id
                        ? "var(--brand-light)"
                        : "var(--bg-secondary)",
                  }}
                >
                  <Layout size={16} />
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            Create Document
          </button>
        </div>
      </div>
    </div>
  );
}
