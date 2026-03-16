"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Editor from "@/components/Editor";
import SearchModal from "@/components/SearchModal";
import NewDocModal from "@/components/NewDocModal";
import NewSpaceModal from "@/components/NewSpaceModal";
import WelcomeView from "@/components/WelcomeView";
import Marketplace from "@/components/Marketplace";
import GuidedTour from "@/components/GuidedTour";
import VoiceChat from "@/components/VoiceChat";
import { useSpaces, useDocuments, useDocument } from "@/hooks/useDocuments";
import { Document } from "@/lib/types";

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"docs" | "marketplace">("docs");
  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [showNewSpace, setShowNewSpace] = useState(false);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);

  const { spaces, createSpace } = useSpaces();
  const { documents, createDocument, deleteDocument, refetch: refetchDocs } = useDocuments(activeSpaceId);
  const { document: activeDoc, saveDocument, shareDocument, unshareDocument } = useDocument(activeDocId);

  // Set default space
  useEffect(() => {
    if (spaces.length > 0 && !activeSpaceId) {
      setActiveSpaceId(spaces[0].id);
    }
  }, [spaces, activeSpaceId]);

  // Fetch recent docs
  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then(setRecentDocs);
  }, []);

  // Dark-first: dark is default, light is opt-in
  useEffect(() => {
    const saved = localStorage.getItem("markdocs-light");
    if (saved === "true") {
      setDarkMode(false);
      document.documentElement.classList.add("light");
    } else {
      setDarkMode(true);
    }
  }, []);

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("light", !next);
      localStorage.setItem("markdocs-light", String(!next));
      return next;
    });
  };

  // Auto-show tour on first visit
  useEffect(() => {
    const toured = localStorage.getItem("markdocs-toured");
    if (!toured) {
      const timer = setTimeout(() => setShowTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseTour = () => {
    setShowTour(false);
    localStorage.setItem("markdocs-toured", "true");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !showSearch
      ) {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setShowNewDoc(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSearch]);

  const handleCreateDoc = async (title: string, templateId?: string) => {
    const doc = await createDocument(title, templateId);
    setActiveDocId(doc.id);
  };

  const handleCreateSpace = async (
    name: string,
    description?: string,
    icon?: string
  ) => {
    const space = await createSpace(name, description, icon);
    setActiveSpaceId(space.id);
  };

  const handleDeleteDoc = async (id: string) => {
    await deleteDocument(id);
    if (activeDocId === id) setActiveDocId(null);
  };

  const handleSelectDoc = (id: string) => {
    setActiveDocId(id);
    setActiveTab("docs");
    const doc = documents.find((d) => d.id === id);
    if (doc && doc.space_id !== activeSpaceId) {
      setActiveSpaceId(doc.space_id);
    }
  };

  const handleSave = useCallback(
    async (updates: { title?: string; content?: string; tags?: string[] }) => {
      await saveDocument(updates);
      refetchDocs();
    },
    [saveDocument, refetchDocs]
  );

  const handleWikiLinkClick = useCallback(
    (pageName: string) => {
      const slug = pageName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const found = documents.find(
        (d) =>
          d.slug === slug ||
          d.title.toLowerCase() === pageName.toLowerCase()
      );
      if (found) {
        setActiveDocId(found.id);
      }
    },
    [documents]
  );

  const handleDocSaved = (docId: string) => {
    refetchDocs();
    setActiveDocId(docId);
    setActiveTab("docs");
  };

  const parseTags = (tags: string): string[] => {
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        spaces={spaces}
        documents={documents}
        activeSpaceId={activeSpaceId}
        activeDocId={activeDocId}
        activeTab={activeTab}
        onSelectSpace={(id) => {
          setActiveSpaceId(id);
          setActiveDocId(null);
          setActiveTab("docs");
        }}
        onSelectDoc={handleSelectDoc}
        onCreateSpace={() => setShowNewSpace(true)}
        onCreateDoc={() => setShowNewDoc(true)}
        onDeleteDoc={handleDeleteDoc}
        onSearch={() => setShowSearch(true)}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDark={toggleDark}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === "marketplace" ? (
          <Marketplace spaces={spaces} onDocSaved={handleDocSaved} />
        ) : activeDoc ? (
          <Editor
            key={activeDoc.id}
            docId={activeDoc.id}
            title={activeDoc.title}
            content={activeDoc.content}
            tags={parseTags(activeDoc.tags)}
            shareId={activeDoc.share_id}
            views={(activeDoc as any).views || 0}
            isFavorite={!!((activeDoc as any).is_favorite)}
            onSave={handleSave}
            onShare={shareDocument}
            onToggleFavorite={async () => {
              await fetch(`/api/documents/${activeDoc.id}/favorite`, { method: "POST" });
              // Refresh doc
              const res = await fetch(`/api/documents/${activeDoc.id}`);
              const updated = await res.json();
              // Force re-render by resetting activeDocId
              setActiveDocId(null);
              setTimeout(() => setActiveDocId(updated.id), 0);
            }}
            onUnshare={unshareDocument}
            onWikiLinkClick={handleWikiLinkClick}
          />
        ) : (
          <WelcomeView
            onCreateDoc={() => setShowNewDoc(true)}
            onSearch={() => setShowSearch(true)}
            onTakeTour={() => setShowTour(true)}
            recentDocs={recentDocs}
            onSelectDoc={handleSelectDoc}
          />
        )}
      </main>

      {/* Modals */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectDoc={handleSelectDoc}
        spaces={spaces}
      />
      <NewDocModal
        isOpen={showNewDoc}
        onClose={() => setShowNewDoc(false)}
        onCreate={handleCreateDoc}
      />
      <NewSpaceModal
        isOpen={showNewSpace}
        onClose={() => setShowNewSpace(false)}
        onCreate={handleCreateSpace}
      />
      <GuidedTour
        isOpen={showTour}
        onClose={handleCloseTour}
      />
      <VoiceChat
        isOpen={showVoiceChat}
        onClose={() => setShowVoiceChat(false)}
        onAction={(action, params) => {
          switch (action) {
            case "create-doc":
              handleCreateDoc(params.title || "Untitled");
              break;
            case "create-from-template":
              handleCreateDoc(params.title || "New Doc", params.template_id);
              break;
            case "search":
              setShowSearch(true);
              break;
            case "open-marketplace":
              setActiveTab("marketplace");
              break;
            case "toggle-theme":
              toggleDark();
              break;
            case "share":
              if (activeDoc) shareDocument();
              break;
            case "save":
              if (activeDoc) handleSave({ content: activeDoc.content });
              break;
            case "create-space":
              if (params.name) handleCreateSpace(params.name);
              else setShowNewSpace(true);
              break;
            case "tour":
              setShowTour(true);
              break;
            case "export":
              if (activeDoc) window.open(`/api/documents/${activeDoc.id}/export?format=md`, "_blank");
              break;
          }
        }}
      />
      {/* Floating Voice Chat Button */}
      {!showVoiceChat && (
        <button
          onClick={() => setShowVoiceChat(true)}
          className="fixed bottom-5 right-5 z-[80] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 animate-pulse-glow"
          style={{ background: "var(--brand-solid)", color: "#fff" }}
          title="Voice Assistant (speak or type commands)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
        </button>
      )}
    </div>
  );
}
