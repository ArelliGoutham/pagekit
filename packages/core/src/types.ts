export interface Page {
  id: string;
  title: string;
  content: string;
  contentType: "mdx" | "openapi" | "rich-text";
  status: "draft" | "published" | "archived";
  parentId: string | null;
  sortOrder: number;
  layout: "docs" | "api-ref" | "wiki" | "blog";
  frontmatter: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageRevision {
  id: string;
  pageId: string;
  content: string;
  title: string;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  provider: "oidc" | "ldap" | "local";
  providerId: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
  lastLoginAt: string | null;
}

export interface NavigationTree {
  id: string;
  name: string;
  context: "docs" | "api-ref" | "wiki";
  createdAt: string;
}

export interface NavigationNode {
  id: string;
  treeId: string;
  pageId: string | null;
  parentNodeId: string | null;
  label: string;
  type: "page" | "folder" | "divider" | "link";
  sortOrder: number;
  icon: string | null;
}

export interface ChangeBatch {
  id: string;
  title: string;
  description: string;
  status: "draft" | "in_review" | "merged";
  createdBy: string;
  createdAt: string;
  mergedAt: string | null;
  mergedBy: string | null;
}

export interface Theme {
  id: string;
  name: string;
  isBuiltin: boolean;
  variables: Record<string, string>;
  config: ThemeConfig;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeConfig {
  logo?: string;
  favicon?: string;
  navStyle?: "sidebar" | "header";
  searchPosition?: "header" | "sidebar";
}

export interface AuthProvider {
  id: string;
  type: "oidc" | "ldap" | "saml";
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
}