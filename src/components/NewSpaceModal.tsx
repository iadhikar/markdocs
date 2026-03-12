"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface NewSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string, icon?: string) => void;
}

const ICONS = ["📁", "📚", "🚀", "💡", "🔧", "📋", "🎯", "🏠", "⚡", "🌟", "📝", "🔬"];

export default function NewSpaceModal({
  isOpen,
  onClose,
  onCreate,
}: NewSpaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📁");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setIcon("📁");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), description.trim() || undefined, icon);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-[420px] rounded-xl shadow-2xl p-6 animate-fadeIn"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">New Space</h3>
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
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  onClick={() => setIcon(i)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border text-lg transition-colors"
                  style={{
                    borderColor:
                      icon === i ? "var(--brand)" : "var(--border)",
                    background:
                      icon === i ? "var(--brand-light)" : "var(--bg-secondary)",
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              Name
            </label>
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Engineering Wiki"
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
              Description (optional)
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A space for engineering documentation"
              className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            Create Space
          </button>
        </div>
      </div>
    </div>
  );
}
