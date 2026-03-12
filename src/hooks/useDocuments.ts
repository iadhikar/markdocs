"use client";

import { useState, useEffect, useCallback } from "react";
import { Document, Space, SearchResult } from "@/lib/types";

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpaces = useCallback(async () => {
    const res = await fetch("/api/spaces");
    const data = await res.json();
    setSpaces(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const createSpace = async (name: string, description?: string, icon?: string) => {
    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, icon }),
    });
    const space = await res.json();
    setSpaces((prev) => [...prev, space]);
    return space;
  };

  const deleteSpace = async (id: string) => {
    await fetch(`/api/spaces/${id}`, { method: "DELETE" });
    setSpaces((prev) => prev.filter((s) => s.id !== id));
  };

  return { spaces, loading, createSpace, deleteSpace, refetch: fetchSpaces };
}

export function useDocuments(spaceId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    if (!spaceId) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    const res = await fetch(`/api/documents?spaceId=${spaceId}`);
    const data = await res.json();
    setDocuments(data);
    setLoading(false);
  }, [spaceId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = async (
    title: string,
    templateId?: string
  ): Promise<Document> => {
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        space_id: spaceId,
        title,
        template_id: templateId,
      }),
    });
    const doc = await res.json();
    setDocuments((prev) => [...prev, doc]);
    return doc;
  };

  const deleteDocument = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return { documents, loading, createDocument, deleteDocument, refetch: fetchDocuments };
}

export function useDocument(docId: string | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docId) {
      setDocument(null);
      setLoading(false);
      return;
    }
    fetch(`/api/documents/${docId}`)
      .then((res) => res.json())
      .then((data) => {
        setDocument(data);
        setLoading(false);
      });
  }, [docId]);

  const saveDocument = async (updates: { title?: string; content?: string; tags?: string[]; parent_id?: string | null; position?: number }) => {
    if (!docId) return;
    const res = await fetch(`/api/documents/${docId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const updated = await res.json();
    setDocument(updated);
    return updated;
  };

  const shareDocument = async () => {
    if (!docId) return null;
    const res = await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
    });
    const data = await res.json();
    setDocument((prev) => (prev ? { ...prev, share_id: data.share_id } : prev));
    return data.share_id;
  };

  const unshareDocument = async () => {
    if (!docId) return;
    await fetch(`/api/documents/${docId}/share`, { method: "DELETE" });
    setDocument((prev) => (prev ? { ...prev, share_id: null } : prev));
  };

  return { document, loading, saveDocument, shareDocument, unshareDocument };
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
    setSearching(false);
  }, []);

  return { results, searching, search };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Document[]>([]);

  useEffect(() => {
    fetch("/api/documents?templates=1")
      .then((res) => res.json())
      .then(setTemplates);
  }, []);

  return templates;
}
