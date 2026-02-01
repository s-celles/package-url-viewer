/**
 * Badge generation module
 * Generates Shields.io badge markdown for PURL viewer links
 */

const SHIELDS_BADGE_URL = 'https://img.shields.io/badge/PURL-viewer-blue';
const PURL_VIEWER_BASE_URL = 'https://s-celles.github.io/package-url-viewer/';

/**
 * Result of badge generation
 */
export interface BadgeResult {
  imageUrl: string;
  linkUrl: string;
  markdown: string;
  label: string;
  purlDisplay: string;
}

export type BadgeVariant = 'versioned' | 'latest';

/**
 * Strip version from a PURL string
 * @param purlString - The PURL string (e.g., "pkg:npm/lodash@4.17.21")
 * @returns PURL without version (e.g., "pkg:npm/lodash")
 */
export function stripVersion(purlString: string): string {
  // Find the @ symbol that precedes the version
  // Version comes after the name, before any ? (qualifiers) or # (subpath)
  const atIndex = purlString.lastIndexOf('@');

  if (atIndex === -1) {
    return purlString; // No version present
  }

  // Check if @ is part of a scoped package (like @angular/core)
  // In that case, the @ would be after pkg:type/ but before the name
  const schemeEnd = purlString.indexOf(':');
  const typeEnd = purlString.indexOf('/', schemeEnd + 1);

  // If @ is right after the type separator, it's a scoped package prefix, not version
  if (atIndex === typeEnd + 1) {
    // Look for another @ after this one for the actual version
    const nextAt = purlString.indexOf('@', atIndex + 1);
    if (nextAt === -1) {
      return purlString; // No version, just scoped package
    }
    // Strip from the second @
    const qualifierIndex = purlString.indexOf('?', nextAt);
    const subpathIndex = purlString.indexOf('#', nextAt);

    let endIndex = purlString.length;
    if (qualifierIndex !== -1) endIndex = Math.min(endIndex, qualifierIndex);
    if (subpathIndex !== -1) endIndex = Math.min(endIndex, subpathIndex);

    return purlString.substring(0, nextAt) + purlString.substring(endIndex);
  }

  // Regular case: @ is the version separator
  const qualifierIndex = purlString.indexOf('?', atIndex);
  const subpathIndex = purlString.indexOf('#', atIndex);

  let endIndex = purlString.length;
  if (qualifierIndex !== -1) endIndex = Math.min(endIndex, qualifierIndex);
  if (subpathIndex !== -1) endIndex = Math.min(endIndex, subpathIndex);

  return purlString.substring(0, atIndex) + purlString.substring(endIndex);
}

/**
 * Check if a PURL string has a version
 * @param purlString - The PURL string to check
 * @returns true if PURL has a version
 */
export function hasVersion(purlString: string): boolean {
  return stripVersion(purlString) !== purlString;
}

/**
 * Generate a single badge for a PURL
 * @param purlString - The original PURL string
 * @param variant - Whether to generate versioned or latest badge
 * @returns BadgeResult with all badge information
 */
export function generateBadge(purlString: string, variant: BadgeVariant): BadgeResult {
  const purlToUse = variant === 'latest' ? stripVersion(purlString) : purlString;
  const encodedPurl = encodeURIComponent(purlToUse);
  const linkUrl = `${PURL_VIEWER_BASE_URL}?purl=${encodedPurl}`;

  return {
    imageUrl: SHIELDS_BADGE_URL,
    linkUrl,
    markdown: `[![PURL Viewer](${SHIELDS_BADGE_URL})](${linkUrl})`,
    label: variant === 'versioned' ? 'Current version' : 'Latest',
    purlDisplay: purlToUse
  };
}

/**
 * Get all applicable badges for a PURL
 * @param purlString - The PURL string
 * @returns Array of BadgeResult objects
 */
export function getBadges(purlString: string): BadgeResult[] {
  const badges: BadgeResult[] = [];

  if (hasVersion(purlString)) {
    // If PURL has version, provide both versioned and latest badges
    badges.push(generateBadge(purlString, 'versioned'));
    badges.push(generateBadge(purlString, 'latest'));
  } else {
    // If no version, only provide the latest badge
    badges.push(generateBadge(purlString, 'latest'));
  }

  return badges;
}
