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
}

export interface TreeNode {
  id: string;
  title: string;
  slug: string;
  children: TreeNode[];
}
