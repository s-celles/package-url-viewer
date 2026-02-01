/**
 * PurlDB display module
 * Renders PurlDB data for UI display
 */

import type { PurlDBPackage, PurlDBDependency } from './types/purldb-types';
import { PURLDB_MAX_VERSIONS_DISPLAY, PURLDB_API_URL } from './purldb';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format date string to readable format
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Render license information
 * @param pkg - Package data or null
 * @returns HTML string for license display
 */
export function renderLicenseInfo(pkg: PurlDBPackage | null): string {
  if (!pkg) {
    return '<p class="purldb-empty">License information not available</p>';
  }

  const license =
    pkg.declared_license_expression_spdx || pkg.declared_license_expression;

  if (!license) {
    return '<p class="purldb-empty">License information not available</p>';
  }

  return `<span class="license-badge">${escapeHtml(license)}</span>`;
}

/**
 * Render version list
 * @param versions - Array of package versions
 * @param currentPurl - Current PURL to highlight
 * @returns HTML string for version list
 */
export function renderVersionList(
  versions: PurlDBPackage[],
  currentPurl: string
): string {
  if (!versions || versions.length === 0) {
    return '<p class="purldb-empty">No version information available</p>';
  }

  // Sort by release_date (newest first), fall back to version string
  const sortedVersions = [...versions].sort((a, b) => {
    if (a.release_date && b.release_date) {
      return (
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    }
    if (a.release_date) return -1;
    if (b.release_date) return 1;
    // Fallback to version string comparison
    return (b.version || '').localeCompare(a.version || '');
  });

  // Filter to only show versions with actual version numbers
  const versionsWithVersion = sortedVersions.filter((v) => v.version);

  if (versionsWithVersion.length === 0) {
    return '<p class="purldb-empty">No other versions available</p>';
  }

  const displayVersions = versionsWithVersion.slice(
    0,
    PURLDB_MAX_VERSIONS_DISPLAY
  );
  const hasMore = versionsWithVersion.length > PURLDB_MAX_VERSIONS_DISPLAY;

  let html = '<ul class="version-list">';

  displayVersions.forEach((v) => {
    const isCurrent = v.purl === currentPurl;
    const currentClass = isCurrent ? ' version-current' : '';
    const releaseInfo = v.release_date ? ` (${formatDate(v.release_date)})` : '';

    html += `
      <li class="version-item${currentClass}">
        <a href="#" class="version-link" data-purl="${escapeHtml(v.purl)}"${isCurrent ? ' aria-current="true"' : ''}>
          ${escapeHtml(v.version || 'unknown')}${releaseInfo}
        </a>
      </li>
    `;
  });

  html += '</ul>';

  if (hasMore) {
    html += `
      <button class="version-show-all" data-total="${versionsWithVersion.length}">
        Show all ${versionsWithVersion.length} versions
      </button>
    `;
  }

  return html;
}

/**
 * Render all versions (for "Show all" expansion)
 * @param versions - Array of all package versions
 * @param currentPurl - Current PURL to highlight
 * @returns HTML string for full version list
 */
export function renderAllVersions(
  versions: PurlDBPackage[],
  currentPurl: string
): string {
  if (!versions || versions.length === 0) {
    return '<p class="purldb-empty">No version information available</p>';
  }

  // Sort by release_date (newest first)
  const sortedVersions = [...versions].sort((a, b) => {
    if (a.release_date && b.release_date) {
      return (
        new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    }
    if (a.release_date) return -1;
    if (b.release_date) return 1;
    return (b.version || '').localeCompare(a.version || '');
  });

  const versionsWithVersion = sortedVersions.filter((v) => v.version);

  let html = '<ul class="version-list version-list-expanded">';

  versionsWithVersion.forEach((v) => {
    const isCurrent = v.purl === currentPurl;
    const currentClass = isCurrent ? ' version-current' : '';
    const releaseInfo = v.release_date ? ` (${formatDate(v.release_date)})` : '';

    html += `
      <li class="version-item${currentClass}">
        <a href="#" class="version-link" data-purl="${escapeHtml(v.purl)}"${isCurrent ? ' aria-current="true"' : ''}>
          ${escapeHtml(v.version || 'unknown')}${releaseInfo}
        </a>
      </li>
    `;
  });

  html += '</ul>';
  html += '<button class="version-show-less">Show fewer versions</button>';

  return html;
}

/**
 * Render package metadata
 * @param pkg - Package data or null
 * @returns HTML string for metadata display
 */
export function renderMetadata(pkg: PurlDBPackage | null): string {
  if (!pkg) {
    return '<p class="purldb-empty">Package details not available</p>';
  }

  const hasAnyMetadata =
    pkg.description ||
    pkg.homepage_url ||
    pkg.repository_homepage_url ||
    pkg.release_date ||
    (pkg.keywords && pkg.keywords.length > 0);

  if (!hasAnyMetadata) {
    return '<p class="purldb-empty">Package details not available</p>';
  }

  let html = '<dl class="metadata-list">';

  if (pkg.description) {
    html += `
      <dt>Description</dt>
      <dd>${escapeHtml(pkg.description)}</dd>
    `;
  }

  if (pkg.homepage_url) {
    html += `
      <dt>Homepage</dt>
      <dd>
        <a href="${escapeHtml(pkg.homepage_url)}" class="external-link" target="_blank" rel="noopener">
          ${escapeHtml(pkg.homepage_url)}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" class="external-icon">
            <path d="M8.75 1.5a.75.75 0 0 0 0 1.5h2.94L5.22 9.47a.75.75 0 0 0 1.06 1.06L12.75 4.06v2.94a.75.75 0 0 0 1.5 0v-5a.5.5 0 0 0-.5-.5h-5Z"/>
            <path d="M3.5 4.75a.25.25 0 0 1 .25-.25H6.5a.75.75 0 0 0 0-1.5H3.75A1.75 1.75 0 0 0 2 4.75v7.5c0 .966.784 1.75 1.75 1.75h7.5A1.75 1.75 0 0 0 13 12.25V9.5a.75.75 0 0 0-1.5 0v2.75a.25.25 0 0 1-.25.25h-7.5a.25.25 0 0 1-.25-.25v-7.5Z"/>
          </svg>
        </a>
      </dd>
    `;
  }

  if (pkg.repository_homepage_url) {
    html += `
      <dt>Repository</dt>
      <dd>
        <a href="${escapeHtml(pkg.repository_homepage_url)}" class="external-link" target="_blank" rel="noopener">
          ${escapeHtml(pkg.repository_homepage_url)}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" class="external-icon">
            <path d="M8.75 1.5a.75.75 0 0 0 0 1.5h2.94L5.22 9.47a.75.75 0 0 0 1.06 1.06L12.75 4.06v2.94a.75.75 0 0 0 1.5 0v-5a.5.5 0 0 0-.5-.5h-5Z"/>
            <path d="M3.5 4.75a.25.25 0 0 1 .25-.25H6.5a.75.75 0 0 0 0-1.5H3.75A1.75 1.75 0 0 0 2 4.75v7.5c0 .966.784 1.75 1.75 1.75h7.5A1.75 1.75 0 0 0 13 12.25V9.5a.75.75 0 0 0-1.5 0v2.75a.25.25 0 0 1-.25.25h-7.5a.25.25 0 0 1-.25-.25v-7.5Z"/>
          </svg>
        </a>
      </dd>
    `;
  }

  if (pkg.release_date) {
    html += `
      <dt>Release Date</dt>
      <dd>${formatDate(pkg.release_date)}</dd>
    `;
  }

  if (pkg.keywords && pkg.keywords.length > 0) {
    const keywordTags = pkg.keywords
      .map((k) => `<span class="keyword-tag">${escapeHtml(k)}</span>`)
      .join('');
    html += `
      <dt>Keywords</dt>
      <dd class="keywords-container">${keywordTags}</dd>
    `;
  }

  html += '</dl>';
  return html;
}

/**
 * Render dependencies list
 * @param deps - Array of dependencies
 * @returns HTML string for dependencies display
 */
export function renderDependencies(deps: PurlDBDependency[]): string {
  if (!deps || deps.length === 0) {
    return '<p class="purldb-empty">No dependencies found</p>';
  }

  // Group by scope
  const grouped: Record<string, PurlDBDependency[]> = {};
  deps.forEach((dep) => {
    const scope = dep.scope || 'runtime';
    if (!grouped[scope]) {
      grouped[scope] = [];
    }
    grouped[scope].push(dep);
  });

  let html = '';

  // Render each scope group
  Object.entries(grouped).forEach(([scope, scopeDeps]) => {
    html += `<div class="dependency-group">`;
    html += `<h4 class="dependency-scope">${escapeHtml(scope)} <span class="dependency-count">(${scopeDeps.length})</span></h4>`;
    html += '<ul class="dependency-list">';

    scopeDeps.forEach((dep) => {
      const optionalBadge = dep.is_optional
        ? '<span class="dep-badge dep-optional">optional</span>'
        : '';

      html += `
        <li class="dependency-item">
          <a href="#" class="dependency-link" data-purl="${escapeHtml(dep.purl)}">
            ${escapeHtml(dep.purl)}
          </a>
          ${optionalBadge}
        </li>
      `;
    });

    html += '</ul></div>';
  });

  return html;
}

/**
 * Generate direct link to PurlDB
 * @param purl - PURL string
 * @returns Full URL to PurlDB API endpoint
 */
export function getPurlDBDisplayUrl(purl: string): string {
  return `${PURLDB_API_URL}?purl=${encodeURIComponent(purl)}`;
}

/**
 * Render PurlDB direct link
 * @param purl - PURL string
 * @returns HTML string for PurlDB link
 */
export function renderPurlDBLink(purl: string): string {
  const url = getPurlDBDisplayUrl(purl);
  return `
    <a href="${escapeHtml(url)}" class="purldb-link" target="_blank" rel="noopener">
      View on PurlDB
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" class="external-icon">
        <path d="M8.75 1.5a.75.75 0 0 0 0 1.5h2.94L5.22 9.47a.75.75 0 0 0 1.06 1.06L12.75 4.06v2.94a.75.75 0 0 0 1.5 0v-5a.5.5 0 0 0-.5-.5h-5Z"/>
        <path d="M3.5 4.75a.25.25 0 0 1 .25-.25H6.5a.75.75 0 0 0 0-1.5H3.75A1.75 1.75 0 0 0 2 4.75v7.5c0 .966.784 1.75 1.75 1.75h7.5A1.75 1.75 0 0 0 13 12.25V9.5a.75.75 0 0 0-1.5 0v2.75a.25.25 0 0 1-.25.25h-7.5a.25.25 0 0 1-.25-.25v-7.5Z"/>
      </svg>
    </a>
  `;
}

/**
 * Render complete PurlDB section
 * @param pkg - Package data
 * @param versions - Available versions
 * @param dependencies - Package dependencies
 * @param currentPurl - Current PURL string
 * @returns HTML string for complete section
 */
export function renderPurlDBSection(
  pkg: PurlDBPackage | null,
  versions: PurlDBPackage[],
  dependencies: PurlDBDependency[],
  currentPurl: string
): string {
  return `
    <div class="purldb-subsection purldb-link-section">
      ${renderPurlDBLink(currentPurl)}
    </div>
    <div class="purldb-subsection" id="purldb-license-content">
      <h3 class="purldb-heading">License</h3>
      ${renderLicenseInfo(pkg)}
    </div>
    <div class="purldb-subsection" id="purldb-versions-content">
      <h3 class="purldb-heading">Available Versions</h3>
      ${renderVersionList(versions, currentPurl)}
    </div>
    <div class="purldb-subsection" id="purldb-metadata-content">
      <h3 class="purldb-heading">Package Details</h3>
      ${renderMetadata(pkg)}
    </div>
    <div class="purldb-subsection" id="purldb-dependencies-content">
      <h3 class="purldb-heading">Dependencies</h3>
      ${renderDependencies(dependencies)}
    </div>
  `;
}
