"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Send, MessageCircle, Loader2, CheckCircle2, Bot, User } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  action?: string;
  status?: "thinking" | "done" | "error";
}

interface VoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, params: Record<string, string>) => void;
}

// Command parser — maps natural language to actions
function parseCommand(text: string): { action: string; params: Record<string, string>; response: string } | null {
  const lower = text.toLowerCase().trim();

  // Create document
  if (lower.match(/^(create|new|make|add|start)\s+(a\s+)?(new\s+)?(doc|document|page|note)/)) {
    const titleMatch = text.match(/(?:called|named|titled|about)\s+["""]?(.+?)["""]?\s*$/i);
    const title = titleMatch ? titleMatch[1] : "Untitled Document";
    return { action: "create-doc", params: { title }, response: `Creating document "${title}"...` };
  }

  // Create from template
  if (lower.match(/(create|new|make|start)\s+(a\s+)?(meeting|rfc|adr|runbook)/)) {
    const tplMap: Record<string, string> = { meeting: "tpl-meeting", rfc: "tpl-rfc", adr: "tpl-adr", runbook: "tpl-runbook" };
    const tplKey = Object.keys(tplMap).find((k) => lower.includes(k)) || "meeting";
    return { action: "create-from-template", params: { template_id: tplMap[tplKey], title: tplKey.charAt(0).toUpperCase() + tplKey.slice(1) }, response: `Creating ${tplKey} document from template...` };
  }

  // Search
  if (lower.match(/^(search|find|look\s*up|look\s*for|where|show\s*me)/)) {
    const query = text.replace(/^(search|find|look\s*up|look\s*for|where\s+is|show\s*me)\s*(for\s+|about\s+)?/i, "").trim();
    return { action: "search", params: { query }, response: `Searching for "${query}"...` };
  }

  // Open marketplace
  if (lower.match(/(open|go\s*to|show|browse)\s*(the\s+)?market/)) {
    return { action: "open-marketplace", params: {}, response: "Opening the Marketplace..." };
  }

  // Toggle dark/light mode
  if (lower.match(/(toggle|switch|change)\s*(to\s+)?(dark|light|theme|mode)/)) {
    return { action: "toggle-theme", params: {}, response: "Toggling theme..." };
  }

  // Share document
  if (lower.match(/(share|publish)\s*(this|the|current)?\s*(doc|document|page)?/)) {
    return { action: "share", params: {}, response: "Sharing the current document..." };
  }

  // Save
  if (lower.match(/(save|ctrl\s*s)/)) {
    return { action: "save", params: {}, response: "Saving document..." };
  }

  // New space
  if (lower.match(/(create|new|add|make)\s+(a\s+)?(new\s+)?space/)) {
    const nameMatch = text.match(/(?:called|named)\s+["""]?(.+?)["""]?\s*$/i);
    const name = nameMatch ? nameMatch[1] : "";
    return { action: "create-space", params: { name }, response: name ? `Creating space "${name}"...` : "Opening new space dialog..." };
  }

  // Take tour
  if (lower.match(/(take|start|show|give)\s*(a\s+|me\s+)?(the\s+)?tour/)) {
    return { action: "tour", params: {}, response: "Starting the guided tour..." };
  }

  // Export
  if (lower.match(/(export|download)\s*(this|the|current)?\s*(doc|document|page)?/)) {
    return { action: "export", params: {}, response: "Exporting document as Markdown..." };
  }

  return null;
}

export default function VoiceChat({ isOpen, onClose, onAction }: VoiceChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hey! I'm your Markdocs assistant. Tell me what you need — type or tap the mic to speak. Try:\n\n- \"Create a new RFC\"\n- \"Search for deployment guides\"\n- \"Open marketplace\"\n- \"Share this document\"\n- \"Toggle dark mode\"",
      status: "done",
    },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = useCallback((msg: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");

    addMessage({ role: "user", text });

    // Parse and execute
    const cmd = parseCommand(text);
    if (cmd) {
      addMessage({ role: "assistant", text: cmd.response, status: "thinking" });
      setTimeout(() => {
        onAction(cmd.action, cmd.params);
        setMessages((prev) =>
          prev.map((m) =>
            m.status === "thinking" ? { ...m, status: "done" as const } : m
          )
        );
      }, 400);
    } else {
      addMessage({
        role: "assistant",
        text: `I can help with these commands:\n- Create docs: "new document called X"\n- Templates: "create an RFC" / "new meeting notes"\n- Search: "search for API design"\n- Navigate: "open marketplace"\n- Actions: "share this doc", "save", "export"\n- Theme: "toggle dark mode"\n- Tour: "take a tour"`,
        status: "done",
      });
    }
  }, [input, addMessage, onAction]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMessage({ role: "assistant", text: "Speech recognition isn't supported in this browser. Try Chrome or Edge.", status: "error" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => {
      setListening(false);
      setProcessingVoice(true);
      // Auto-send after voice stops
      setTimeout(() => {
        setProcessingVoice(false);
        const currentInput = (document.querySelector('[data-voice-input]') as HTMLInputElement)?.value;
        if (currentInput?.trim()) {
          // Trigger send
          const text = currentInput.trim();
          setInput("");
          addMessage({ role: "user", text });
          const cmd = parseCommand(text);
          if (cmd) {
            addMessage({ role: "assistant", text: cmd.response, status: "thinking" });
            setTimeout(() => {
              onAction(cmd.action, cmd.params);
              setMessages((prev) =>
                prev.map((m) =>
                  m.status === "thinking" ? { ...m, status: "done" as const } : m
                )
              );
            }, 400);
          } else {
            addMessage({ role: "assistant", text: "I didn't understand that. Try saying things like 'create a new document' or 'search for deployment guides'.", status: "done" });
          }
        }
      }, 300);
    };

    recognition.onerror = () => {
      setListening(false);
      addMessage({ role: "assistant", text: "Couldn't hear you. Please try again.", status: "error" });
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [addMessage, onAction]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90] animate-slideUp" style={{ width: 380 }}>
      <div
        className="rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-bright)",
          height: 520,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--brand-solid)" }}
          >
            <Bot size={14} color="#fff" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Markdocs Assistant</div>
            <div className="text-xs" style={{ color: "var(--accent-green)" }}>
              {listening ? "Listening..." : "Online"}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md" style={{ color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: "var(--brand-light)" }}
                >
                  <Bot size={12} style={{ color: "var(--brand)" }} />
                </div>
              )}
              <div
                className="px-3 py-2 rounded-xl text-xs leading-relaxed max-w-[85%]"
                style={{
                  background: msg.role === "user" ? "var(--brand-solid)" : "var(--bg-tertiary)",
                  color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.text}
                {msg.status === "thinking" && (
                  <span className="inline-flex items-center gap-1 ml-1" style={{ color: "var(--accent-amber)" }}>
                    <Loader2 size={10} className="animate-spin" />
                  </span>
                )}
                {msg.status === "done" && msg.role === "assistant" && msg.id !== "welcome" && (
                  <span className="inline-flex items-center gap-0.5 ml-1" style={{ color: "var(--accent-green)" }}>
                    <CheckCircle2 size={10} />
                  </span>
                )}
              </div>
              {msg.role === "user" && (
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: "var(--brand-solid)" }}
                >
                  <User size={12} color="#fff" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="px-3 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{
              background: "var(--bg-tertiary)",
              border: listening ? "1px solid var(--brand)" : "1px solid var(--border)",
              boxShadow: listening ? "0 0 12px rgba(129, 140, 248, 0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            <input
              ref={inputRef}
              data-voice-input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={listening ? "Listening..." : "Type or speak a command..."}
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: "var(--text-primary)" }}
            />
            {/* Voice button */}
            <button
              onClick={listening ? stopListening : startListening}
              className="relative p-2 rounded-lg transition-all"
              style={{
                background: listening ? "var(--brand-solid)" : "var(--bg-elevated)",
                color: listening ? "#fff" : "var(--text-muted)",
              }}
            >
              {listening && (
                <>
                  <span className="voice-ring" style={{ width: 32, height: 32, top: 0, left: 0 }} />
                  <span className="voice-ring" style={{ width: 32, height: 32, top: 0, left: 0, animationDelay: "0.5s" }} />
                </>
              )}
              {listening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 rounded-lg transition-all disabled:opacity-30"
              style={{ background: "var(--brand-solid)", color: "#fff" }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
