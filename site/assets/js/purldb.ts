/**
 * PurlDB API service
 * Provides functions to fetch package data from PurlDB
 */

import type {
  PurlDBPackage,
  PurlDBResponse,
  PurlDBCacheEntry,
} from './types/purldb-types';

// API Constants
export const PURLDB_BASE_URL = 'https://public.purldb.io';
export const PURLDB_API_URL = `${PURLDB_BASE_URL}/api/packages/`;
export const PURLDB_TIMEOUT_MS = 10000; // Increased for proxy latency
export const PURLDB_MAX_VERSIONS_DISPLAY = 10;
const MAX_PAGES = 5; // Reduced to limit proxy requests

// CORS proxy to bypass same-origin policy (PurlDB doesn't support CORS)
const CORS_PROXY_URL = 'https://api.codetabs.com/v1/proxy/?quest=';

/**
 * Wrap a URL with the CORS proxy
 */
function withCorsProxy(url: string): string {
  return `${CORS_PROXY_URL}${encodeURIComponent(url)}`;
}

// In-memory cache for session duration
const packageCache = new Map<string, PurlDBCacheEntry>();
const versionsCache = new Map<string, PurlDBPackage[]>();

/**
 * Get cached package data
 */
function getCachedPackage(purl: string): PurlDBPackage | null | undefined {
  const entry = packageCache.get(purl);
  if (entry) {
    return entry.package;
  }
  return undefined;
}

/**
 * Set cached package data
 */
function setCachedPackage(purl: string, data: PurlDBPackage | null): void {
  packageCache.set(purl, {
    package: data,
    versions: [],
    fetchedAt: Date.now(),
  });
}

/**
 * Generate cache key for versions query
 */
function getVersionsCacheKey(
  type: string,
  namespace: string | null,
  name: string
): string {
  return `${type}/${namespace || ''}/${name}`;
}

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = PURLDB_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch package data by exact PURL
 * @param purl - Full PURL string (e.g., pkg:npm/lodash@4.17.21)
 * @returns Package data or null if not found
 */
export async function fetchPackageByPurl(
  purl: string
): Promise<PurlDBPackage | null> {
  // Check cache first
  const cached = getCachedPackage(purl);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const url = `${PURLDB_API_URL}?purl=${encodeURIComponent(purl)}`;
    const response = await fetchWithTimeout(withCorsProxy(url));

    if (!response.ok) {
      console.error(`PurlDB API error: ${response.status} ${response.statusText}`);
      setCachedPackage(purl, null);
      return null;
    }

    const data: PurlDBResponse = await response.json();
    const result = data.results[0] || null;

    // Cache the result
    setCachedPackage(purl, result);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('PurlDB request timed out');
      } else {
        console.error('PurlDB fetch error:', error.message);
      }
    }
    return null;
  }
}

/**
 * Fetch all versions of a package by type/namespace/name
 * @param type - Package type (npm, pypi, maven, etc.)
 * @param namespace - Package namespace or null
 * @param name - Package name
 * @returns Array of package versions
 */
export async function fetchPackageVersions(
  type: string,
  namespace: string | null,
  name: string
): Promise<PurlDBPackage[]> {
  const cacheKey = getVersionsCacheKey(type, namespace, name);

  // Check cache first
  const cached = versionsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const params = new URLSearchParams({ type, name });
    if (namespace) {
      params.set('namespace', namespace);
    }

    let allResults: PurlDBPackage[] = [];
    let nextUrl: string | null = `${PURLDB_API_URL}?${params.toString()}`;
    let pageCount = 0;

    // Handle pagination
    while (nextUrl && pageCount < MAX_PAGES) {
      const response = await fetchWithTimeout(withCorsProxy(nextUrl));

      if (!response.ok) {
        console.error(`PurlDB versions API error: ${response.status}`);
        break;
      }

      const data: PurlDBResponse = await response.json();
      allResults = allResults.concat(data.results);
      nextUrl = data.next;
      pageCount++;
    }

    // Cache the results
    versionsCache.set(cacheKey, allResults);
    return allResults;
  } catch (error) {
    if (error instanceof Error) {
      console.error('PurlDB versions fetch error:', error.message);
    }
    return [];
  }
}

/**
 * Generate direct link to PurlDB for a PURL
 * @param purl - PURL string
 * @returns Full URL to PurlDB API endpoint
 */
export function getPurlDBUrl(purl: string): string {
  return `${PURLDB_API_URL}?purl=${encodeURIComponent(purl)}`;
}

/**
 * Clear all caches (useful for testing)
 */
export function clearCache(): void {
  packageCache.clear();
  versionsCache.clear();
}
