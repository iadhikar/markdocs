"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, ShoppingBag, Tag, Download, DollarSign, Plus, X,
  Sparkles, ArrowUpDown, Filter, FileText, Check, FolderOpen, Eye,
} from "lucide-react";
import { Space } from "@/lib/types";
import MarkdownRenderer from "./MarkdownRenderer";

interface MarketplaceListing {
  id: string;
  seller_name: string;
  title: string;
  description: string;
  price_cents: number;
  preview: string;
  content?: string | null;
  tags: string;
  category: string;
  downloads: number;
  created_at: string;
  has_access?: boolean;
}

interface MarketplaceProps {
  spaces: Space[];
  onDocSaved: (docId: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: "🏪" },
  { id: "engineering", label: "Engineering", icon: "⚡" },
  { id: "management", label: "Management", icon: "📋" },
  { id: "operations", label: "Operations", icon: "🔧" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "general", label: "General", icon: "📝" },
];

export default function Marketplace({ spaces, onDocSaved }: MarketplaceProps) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MarketplaceListing[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [saveToSpace, setSaveToSpace] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ id: string; type: "downloaded" | "saved" | "purchased" } | null>(null);
  const [previewListing, setPreviewListing] = useState<MarketplaceListing | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/marketplace?category=${category}&sort=${sort}`);
    const data = await res.json();
    setListings(data);
    setLoading(false);
  }, [category, sort]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleGetListing = async (listing: MarketplaceListing) => {
    if (listing.price_cents === 0) {
      // Free - prompt for email and optional space
      setShowCheckout(listing.id);
      setSelectedListing(listing);
    } else {
      // Paid - need checkout
      setShowCheckout(listing.id);
      setSelectedListing(listing);
    }
  };

  const handleDownload = async () => {
    if (!selectedListing || !email) return;

    if (selectedListing.price_cents === 0) {
      // Free download
      const res = await fetch(`/api/marketplace/${selectedListing.id}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, space_id: saveToSpace }),
      });
      const data = await res.json();
      if (data.success) {
        // Trigger .md file download
        const blob = new Blob([data.content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedListing.title.toLowerCase().replace(/\s+/g, "-")}.md`;
        a.click();
        URL.revokeObjectURL(url);

        setActionResult({ id: selectedListing.id, type: data.saved_doc_id ? "saved" : "downloaded" });
        if (data.saved_doc_id) onDocSaved(data.saved_doc_id);
        setShowCheckout(null);
        fetchListings();
        setTimeout(() => setActionResult(null), 3000);
      }
    } else {
      // Paid - create checkout session
      const res = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: selectedListing.id, email }),
      });
      const data = await res.json();

      if (data.mode === "simulated") {
        // Dev mode: auto-confirm
        await fetch("/api/marketplace/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: data.session_id, email }),
        });

        // Now download
        const dlRes = await fetch(`/api/marketplace/${selectedListing.id}/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, space_id: saveToSpace }),
        });
        const dlData = await dlRes.json();
        if (dlData.success) {
          const blob = new Blob([dlData.content], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${selectedListing.title.toLowerCase().replace(/\s+/g, "-")}.md`;
          a.click();
          URL.revokeObjectURL(url);

          setActionResult({ id: selectedListing.id, type: "purchased" });
          if (dlData.saved_doc_id) onDocSaved(dlData.saved_doc_id);
          setShowCheckout(null);
          fetchListings();
          setTimeout(() => setActionResult(null), 3000);
        }
      } else if (data.checkout_url) {
        // Real Stripe - redirect
        window.location.href = data.checkout_url;
      }
    }
  };

  const handlePreview = async (listing: MarketplaceListing) => {
    const res = await fetch(`/api/marketplace/${listing.id}?email=${encodeURIComponent(email || "preview")}`);
    const data = await res.json();
    setPreviewListing(data);
  };

  const displayListings = searchResults !== null ? searchResults : listings;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ShoppingBag size={28} style={{ color: "var(--brand)" }} />
              <h1 className="text-2xl font-bold">MD Marketplace</h1>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Buy, sell, and discover premium Markdown documents
            </p>
          </div>
          <button
            onClick={() => setShowSellModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--brand)", color: "#fff" }}
          >
            <Plus size={16} />
            Sell a Document
          </button>
        </div>

        {/* Search Bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-6"
          style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
        >
          <Sparkles size={18} style={{ color: "var(--brand)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search marketplace... e.g. 'API design guide' or 'incident response'"
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--text-primary)" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter size={14} style={{ color: "var(--text-muted)" }} />
          </div>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: category === cat.id ? "var(--brand)" : "var(--bg-secondary)",
                color: category === cat.id ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${category === cat.id ? "var(--brand)" : "var(--border)"}`,
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown size={14} style={{ color: "var(--text-muted)" }} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs px-2 py-1 rounded border outline-none"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>Loading marketplace...</div>
        ) : displayListings.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            {searchQuery ? `No results for "${searchQuery}"` : "No listings yet. Be the first to sell!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayListings.map((listing) => {
              const tags = (() => { try { return JSON.parse(listing.tags); } catch { return []; } })();
              return (
                <div
                  key={listing.id}
                  className="rounded-xl border p-5 transition-all hover:shadow-md"
                  style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm leading-tight">{listing.title}</h3>
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ml-2"
                      style={{
                        background: listing.price_cents === 0 ? "#10b981" : "var(--brand)",
                        color: "#fff",
                      }}
                    >
                      {formatPrice(listing.price_cents)}
                    </span>
                  </div>
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {listing.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1">
                        <Download size={12} /> {listing.downloads}
                      </span>
                      <span>by {listing.seller_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreview(listing)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <button
                        onClick={() => handleGetListing(listing)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ background: "var(--brand)", color: "#fff" }}
                      >
                        {actionResult?.id === listing.id ? (
                          <><Check size={12} /> {actionResult.type === "purchased" ? "Purchased!" : "Got it!"}</>
                        ) : listing.price_cents === 0 ? (
                          <><Download size={12} /> Get Free</>
                        ) : (
                          <><DollarSign size={12} /> Buy</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout / Download Modal */}
      {showCheckout && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="w-[480px] rounded-xl shadow-2xl p-6 animate-fadeIn"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {selectedListing.price_cents === 0 ? "Download Document" : "Purchase Document"}
              </h3>
              <button onClick={() => setShowCheckout(null)}>
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>

            <div
              className="p-3 rounded-lg border mb-4"
              style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{selectedListing.title}</span>
                <span
                  className="font-bold text-sm px-2 py-0.5 rounded"
                  style={{ background: selectedListing.price_cents === 0 ? "#10b981" : "var(--brand)", color: "#fff" }}
                >
                  {formatPrice(selectedListing.price_cents)}
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                by {selectedListing.seller_name}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Your email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Also save to a Space? (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSaveToSpace(null)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition-colors"
                    style={{
                      borderColor: saveToSpace === null ? "var(--brand)" : "var(--border)",
                      background: saveToSpace === null ? "var(--brand-light)" : "var(--bg-secondary)",
                    }}
                  >
                    <Download size={12} /> Download only
                  </button>
                  {spaces.map((space) => (
                    <button
                      key={space.id}
                      onClick={() => setSaveToSpace(space.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs transition-colors"
                      style={{
                        borderColor: saveToSpace === space.id ? "var(--brand)" : "var(--border)",
                        background: saveToSpace === space.id ? "var(--brand-light)" : "var(--bg-secondary)",
                      }}
                    >
                      <span>{space.icon}</span> {space.name}
                    </button>
                  ))}
                </div>
                {saveToSpace && (
                  <div className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    The document will be downloaded AND saved to your selected Space.
                  </div>
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={!email}
                className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                style={{ background: "var(--brand)", color: "#fff" }}
              >
                {selectedListing.price_cents === 0
                  ? "Download for Free"
                  : `Pay ${formatPrice(selectedListing.price_cents)} & Download`}
              </button>

              {selectedListing.price_cents > 0 && (
                <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Powered by Stripe. Secure payment processing.
                  {!process.env.NEXT_PUBLIC_STRIPE_KEY && " (Dev mode: payments are simulated)"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="w-[700px] max-h-[80vh] rounded-xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="font-semibold">{previewListing.title}</h3>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  by {previewListing.seller_name} -- {formatPrice(previewListing.price_cents)}
                </span>
              </div>
              <button onClick={() => setPreviewListing(null)}>
                <X size={18} style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {previewListing.has_access && previewListing.content ? (
                <MarkdownRenderer content={previewListing.content} />
              ) : (
                <div>
                  <MarkdownRenderer content={previewListing.preview} />
                  <div
                    className="mt-4 p-4 rounded-lg border text-center"
                    style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
                  >
                    <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
                      {previewListing.price_cents === 0
                        ? "This is a free document. Download to see the full content."
                        : `Purchase for ${formatPrice(previewListing.price_cents)} to see the full content.`}
                    </p>
                    <button
                      onClick={() => { setPreviewListing(null); handleGetListing(previewListing); }}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: "var(--brand)", color: "#fff" }}
                    >
                      {previewListing.price_cents === 0 ? "Get Free" : "Purchase"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && (
        <SellModal
          onClose={() => setShowSellModal(false)}
          onCreated={() => { setShowSellModal(false); fetchListings(); }}
        />
      )}
    </div>
  );
}

function SellModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [seller, setSeller] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [price, setPrice] = useState("0");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !content || !seller) return;
    setSubmitting(true);
    await fetch("/api/marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        seller_name: seller,
        title,
        description,
        content,
        price_cents: Math.round(parseFloat(price) * 100),
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setSubmitting(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="w-[560px] max-h-[85vh] rounded-xl shadow-2xl p-6 overflow-auto animate-fadeIn"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Sell a Markdown Document</h3>
          <button onClick={onClose}><X size={18} style={{ color: "var(--text-muted)" }} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Your name / brand</label>
            <input value={seller} onChange={(e) => setSeller(e.target.value)} placeholder="TechWriter"
              className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Complete API Design Guide"
              className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description for buyers"
              className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Markdown Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8}
              placeholder="# Your Document\n\nPaste your full markdown content here..."
              className="w-full px-3 py-2 rounded-lg border outline-none text-sm font-mono"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Price (USD, 0 = free)</label>
              <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
                style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                <option value="engineering">Engineering</option>
                <option value="management">Management</option>
                <option value="operations">Operations</option>
                <option value="business">Business</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tags (comma-separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="api, design, guide"
              className="w-full px-3 py-2 rounded-lg border outline-none text-sm"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
          </div>
          <button onClick={handleSubmit} disabled={!title || !content || !seller || submitting}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: "var(--brand)", color: "#fff" }}>
            {submitting ? "Publishing..." : parseFloat(price) > 0 ? `List for $${parseFloat(price).toFixed(2)}` : "Publish for Free"}
          </button>
        </div>
      </div>
    </div>
  );
}
