"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, Volume2 } from "lucide-react";

interface VoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, params: Record<string, string>) => void;
}

interface LogEntry {
  id: string;
  type: "heard" | "action" | "error" | "info";
  text: string;
}

// Speak text aloud via Web Speech Synthesis
function speak(text: string, onDone?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onDone?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.05;
  utterance.pitch = 1;
  utterance.volume = 0.9;
  // Prefer a natural-sounding voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Daniel") || v.lang.startsWith("en")
  );
  if (preferred) utterance.voice = preferred;
  utterance.onend = () => onDone?.();
  window.speechSynthesis.speak(utterance);
}

// Fuzzy command parser — handles accents, filler words, varied phrasing
function parseCommand(raw: string): { action: string; params: Record<string, string>; reply: string } | null {
  // Normalize: lowercase, trim, remove filler words
  const text = raw.toLowerCase()
    .replace(/\b(please|can you|could you|i want to|i'd like to|go ahead and|um+|uh+|okay|hey|hi|so)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // --- Create document ---
  if (text.match(/(create|new|make|add|start|open)\s*(a\s*)?(new\s*)?(doc|document|page|note|file)/)) {
    const titleMatch = raw.match(/(?:called|named|titled|about|for)\s+(.+?)\.?\s*$/i)
      || raw.match(/(doc|document|page|note|file)\s+(.+?)\.?\s*$/i);
    const title = titleMatch ? (titleMatch[2] || titleMatch[1]).trim() : "";
    if (title && title.length > 2) {
      return { action: "create-doc", params: { title }, reply: `Creating "${title}".` };
    }
    return { action: "create-doc-dialog", params: {}, reply: "Opening new document dialog." };
  }

  // --- Templates ---
  if (text.match(/(create|new|make|start)\s*(a\s*)?(meeting|rfc|adr|runbook|architecture|incident)/)) {
    const map: Record<string, [string, string]> = {
      meeting: ["tpl-meeting", "Meeting Notes"],
      rfc: ["tpl-rfc", "RFC"],
      adr: ["tpl-adr", "Architecture Decision Record"],
      architecture: ["tpl-adr", "Architecture Decision Record"],
      runbook: ["tpl-runbook", "Runbook"],
      incident: ["tpl-runbook", "Incident Runbook"],
    };
    const key = Object.keys(map).find((k) => text.includes(k)) || "meeting";
    const [id, name] = map[key];
    return { action: "create-from-template", params: { template_id: id, title: name }, reply: `Creating ${name} from template.` };
  }

  // --- Search ---
  if (text.match(/(search|find|look\s*for|look\s*up|where|show\s*me|get\s*me)/)) {
    const query = raw
      .replace(/^.*?(search|find|look\s*for|look\s*up|where\s*is|show\s*me|get\s*me)\s*(for\s*|about\s*)?/i, "")
      .replace(/[?.!]$/, "")
      .trim();
    if (query.length > 1) {
      return { action: "search", params: { query }, reply: `Searching for "${query}".` };
    }
    return { action: "open-search", params: {}, reply: "Opening search." };
  }

  // --- Marketplace ---
  if (text.match(/(open|go\s*to|show|browse|visit)\s*(the\s*)?(market|store|shop)/)) {
    return { action: "open-marketplace", params: {}, reply: "Opening the Marketplace." };
  }

  // --- Theme ---
  if (text.match(/(dark|light|toggle|switch)\s*(mode|theme)?/) || text.match(/(mode|theme)\s*(dark|light|toggle|switch)/)) {
    return { action: "toggle-theme", params: {}, reply: "Toggling theme." };
  }

  // --- Share ---
  if (text.match(/(share|publish)\s*(this|the|current|my)?/)) {
    return { action: "share", params: {}, reply: "Sharing the document." };
  }

  // --- Save ---
  if (text.match(/\bsave\b/)) {
    return { action: "save", params: {}, reply: "Saved." };
  }

  // --- Export / Download ---
  if (text.match(/(export|download)/)) {
    return { action: "export", params: {}, reply: "Exporting as Markdown." };
  }

  // --- New space ---
  if (text.match(/(create|new|add|make)\s*(a\s*)?(new\s*)?space/)) {
    const nameMatch = raw.match(/(?:called|named)\s+(.+?)\.?\s*$/i);
    if (nameMatch) {
      return { action: "create-space", params: { name: nameMatch[1].trim() }, reply: `Creating space "${nameMatch[1].trim()}".` };
    }
    return { action: "create-space-dialog", params: {}, reply: "Opening new space dialog." };
  }

  // --- Tour ---
  if (text.match(/(tour|guide|walkthrough|onboard)/)) {
    return { action: "tour", params: {}, reply: "Starting the tour." };
  }

  // --- Go back / home ---
  if (text.match(/(go\s*(back|home)|home|close\s*doc|close\s*this)/)) {
    return { action: "go-home", params: {}, reply: "Going home." };
  }

  // --- Favorite ---
  if (text.match(/(favorite|star|bookmark)\s*(this)?/)) {
    return { action: "favorite", params: {}, reply: "Toggling favorite." };
  }

  // --- Stop / close assistant ---
  if (text.match(/(stop|close|quit|exit|bye|goodbye|shut\s*up|never\s*mind)/)) {
    return { action: "close-assistant", params: {}, reply: "Goodbye!" };
  }

  return null;
}

export default function VoiceChat({ isOpen, onClose, onAction }: VoiceChatProps) {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const recognitionRef = useRef<any>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const autoRestartRef = useRef(true);

  const addLog = useCallback((type: LogEntry["type"], text: string) => {
    setLog((prev) => [...prev.slice(-20), { id: Date.now() + "" + Math.random(), type, text }]);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  // Start recognition loop
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      addLog("error", "Speech recognition not supported. Use Chrome or Edge.");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setListening(true);
      setStatus("listening");
      setTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(final || interim);
    };

    recognition.onend = () => {
      setListening(false);
      const currentTranscript = transcript || (document.querySelector("[data-transcript]") as any)?.textContent || "";

      if (currentTranscript.trim()) {
        setStatus("processing");
        addLog("heard", currentTranscript.trim());

        const cmd = parseCommand(currentTranscript.trim());
        if (cmd) {
          addLog("action", cmd.reply);
          setStatus("speaking");
          setSpeaking(true);
          speak(cmd.reply, () => {
            setSpeaking(false);
            if (cmd.action === "close-assistant") {
              autoRestartRef.current = false;
              onClose();
              return;
            }
            onAction(cmd.action, cmd.params);
            setStatus("idle");
            // Auto-restart listening after action
            if (autoRestartRef.current) {
              setTimeout(() => startListening(), 600);
            }
          });
        } else {
          const fallback = "I didn't catch that. Try saying create a document, search for something, or open marketplace.";
          addLog("info", fallback);
          setStatus("speaking");
          setSpeaking(true);
          speak(fallback, () => {
            setSpeaking(false);
            setStatus("idle");
            if (autoRestartRef.current) {
              setTimeout(() => startListening(), 600);
            }
          });
        }
      } else {
        setStatus("idle");
        // No speech detected, restart
        if (autoRestartRef.current) {
          setTimeout(() => startListening(), 300);
        }
      }
      setTranscript("");
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        // Silently restart
        setListening(false);
        setStatus("idle");
        if (autoRestartRef.current) {
          setTimeout(() => startListening(), 300);
        }
        return;
      }
      if (event.error === "aborted") return;
      setListening(false);
      setStatus("idle");
      addLog("error", `Error: ${event.error}. Try again.`);
      if (autoRestartRef.current) {
        setTimeout(() => startListening(), 1000);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [addLog, onAction, onClose, transcript]);

  const stopListening = useCallback(() => {
    autoRestartRef.current = false;
    try { recognitionRef.current?.abort(); } catch {}
    setListening(false);
    setStatus("idle");
    window.speechSynthesis?.cancel();
  }, []);

  // Start listening when opened
  useEffect(() => {
    if (isOpen) {
      autoRestartRef.current = true;
      setLog([]);
      // Greet
      const greeting = "Hi! I'm listening. What would you like to do?";
      addLog("info", greeting);
      setStatus("speaking");
      setSpeaking(true);
      speak(greeting, () => {
        setSpeaking(false);
        startListening();
      });
    } else {
      stopListening();
    }
    return () => {
      autoRestartRef.current = false;
      try { recognitionRef.current?.abort(); } catch {}
      window.speechSynthesis?.cancel();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const statusColor = status === "listening" ? "var(--accent-green)"
    : status === "processing" ? "var(--accent-amber)"
    : status === "speaking" ? "var(--brand)"
    : "var(--text-muted)";

  const statusText = status === "listening" ? "Listening..."
    : status === "processing" ? "Processing..."
    : status === "speaking" ? "Speaking..."
    : "Ready";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center pb-6 pointer-events-none">
      <div
        className="pointer-events-auto w-[400px] rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-bright)",
          boxShadow: "0 12px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Visualization */}
        <div
          className="relative flex flex-col items-center justify-center py-8"
          style={{ background: "var(--bg-primary)" }}
        >
          {/* Close */}
          <button
            onClick={() => { stopListening(); onClose(); }}
            className="absolute top-3 right-3 p-1.5 rounded-md"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>

          {/* Orb */}
          <div className="relative">
            {/* Rings */}
            {status === "listening" && (
              <>
                <div className="absolute inset-0 rounded-full border-2 animate-ping" style={{ borderColor: "var(--accent-green)", opacity: 0.3 }} />
                <div className="voice-ring" style={{ width: 72, height: 72, top: -4, left: -4 }} />
                <div className="voice-ring" style={{ width: 72, height: 72, top: -4, left: -4, animationDelay: "0.75s" }} />
              </>
            )}
            {status === "speaking" && (
              <div className="absolute inset-0 rounded-full animate-pulse" style={{ boxShadow: "0 0 30px rgba(129, 140, 248, 0.5)" }} />
            )}
            <button
              onClick={listening ? stopListening : startListening}
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all"
              style={{
                background: listening ? "var(--accent-green)" : speaking ? "var(--brand-solid)" : "var(--bg-elevated)",
                color: listening || speaking ? "#fff" : "var(--text-secondary)",
                boxShadow: listening ? "0 0 24px rgba(52, 211, 153, 0.4)" : speaking ? "0 0 24px rgba(129, 140, 248, 0.4)" : "none",
              }}
            >
              {listening ? <Mic size={24} /> : speaking ? <Volume2 size={24} /> : <MicOff size={24} />}
            </button>
          </div>

          {/* Status */}
          <div className="mt-4 text-xs font-medium" style={{ color: statusColor }}>
            {statusText}
          </div>

          {/* Live transcript */}
          {transcript && (
            <div
              data-transcript
              className="mt-2 px-4 text-center text-sm font-medium animate-fadeIn max-w-[320px]"
              style={{ color: "var(--text-primary)" }}
            >
              &ldquo;{transcript}&rdquo;
            </div>
          )}
        </div>

        {/* Action Log */}
        <div
          className="max-h-[180px] overflow-auto px-4 py-3 space-y-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {log.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 animate-fadeIn">
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{
                  background: entry.type === "heard" ? "var(--accent-amber)"
                    : entry.type === "action" ? "var(--accent-green)"
                    : entry.type === "error" ? "var(--accent-rose)"
                    : "var(--text-muted)",
                }}
              />
              <span className="text-xs" style={{
                color: entry.type === "action" ? "var(--accent-green)"
                  : entry.type === "error" ? "var(--accent-rose)"
                  : "var(--text-secondary)",
              }}>
                {entry.type === "heard" && <span style={{ color: "var(--text-muted)" }}>You: </span>}
                {entry.text}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Hint */}
        <div
          className="px-4 py-2.5 text-center"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg-tertiary)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Say: &ldquo;create a new RFC&rdquo; &middot; &ldquo;search for API design&rdquo; &middot; &ldquo;open marketplace&rdquo; &middot; &ldquo;stop&rdquo;
          </span>
        </div>
      </div>
    </div>
  );
}
