export interface Space {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  space_id: string;
  title: string;
  slug: string;
  content: string;
  parent_id: string | null;
  position: number;
  tags: string;
  share_id: string | null;
  is_template: number;
  template_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: number;
  document_id: string;
  content: string;
  title: string;
  created_at: string;
}

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  space_id: string;
  snippet: string;
  score: number;
  matchedTerms: string[];
}

export interface TreeNode {
  id: string;
  title: string;
  slug: string;
  children: TreeNode[];
}

// Marketplace types
export interface MarketplaceListing {
  id: string;
  seller_name: string;
  title: string;
  description: string;
  price_cents: number; // price in cents (e.g. 499 = $4.99, 0 = free)
  content: string; // the actual MD content (hidden until purchased)
  preview: string; // first ~200 chars shown publicly
  tags: string;
  category: string;
  downloads: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrder {
  id: string;
  listing_id: string;
  buyer_email: string;
  amount_cents: number;
  stripe_session_id: string | null;
  status: "pending" | "completed" | "free";
  created_at: string;
}
