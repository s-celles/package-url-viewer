/**
 * PurlDB API type definitions
 * Based on data-model.md specification
 */

/**
 * Represents a contributor/author/maintainer from PurlDB
 */
export interface PurlDBParty {
  type: string;
  name: string | null;
  email: string | null;
  url: string | null;
}

/**
 * Represents a single package entry from the PurlDB API response
 */
export interface PurlDBPackage {
  url: string;
  purl: string;
  type: string;
  namespace: string | null;
  name: string;
  version: string | null;
  declared_license_expression: string | null;
  declared_license_expression_spdx: string | null;
  description: string | null;
  homepage_url: string | null;
  repository_homepage_url: string | null;
  release_date: string | null;
  keywords: string[];
  dependencies: string;
  parties: PurlDBParty[];
}

/**
 * Paginated API response wrapper from PurlDB
 */
export interface PurlDBResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PurlDBPackage[];
}

/**
 * Represents a package dependency from PurlDB
 */
export interface PurlDBDependency {
  purl: string;
  scope: string;
  is_runtime: boolean;
  is_optional: boolean;
}

/**
 * UI state management for PurlDB section
 */
export interface PurlDBState {
  loading: boolean;
  error: string | null;
  package: PurlDBPackage | null;
  versions: PurlDBPackage[];
  dependencies: PurlDBDependency[];
}

/**
 * Cache entry structure for session caching
 */
export interface PurlDBCacheEntry {
  package: PurlDBPackage | null;
  versions: PurlDBPackage[];
  fetchedAt: number;
}
