import { parsePurl } from './purl-parser';
import { getRegistryUrl } from './registry-mapper';
import { getVulnerableCodeUrl } from './vulnerablecode';
import { getBadges } from './badges';
import { fetchPackageByPurl, fetchPackageVersions } from './purldb';
import { renderPurlDBSection, renderAllVersions, renderVersionList } from './purldb-display';
import type { PackageURL, ParseResult, RegistryResult } from './types/registry-types';
import type { VulnerableCodeResult } from './vulnerablecode';
import type { BadgeResult } from './badges';
import type { PurlDBPackage, PurlDBDependency } from './types/purldb-types';

// DOM Elements
const purlInput = document.getElementById('purl-input') as HTMLInputElement;
const parseButton = document.getElementById('parse-button') as HTMLButtonElement;
const resultSection = document.getElementById('result-section') as HTMLElement;
const registryResult = document.getElementById('registry-result') as HTMLElement;
const componentsBody = document.getElementById('components-body') as HTMLTableSectionElement;
const shareInput = document.getElementById('share-input') as HTMLInputElement;
const copyButton = document.getElementById('copy-button') as HTMLButtonElement;
const errorResult = document.getElementById('error-result') as HTMLElement;
const vulnerablecodeResult = document.getElementById('vulnerablecode-result') as HTMLElement;
const badgeContainer = document.getElementById('badge-container') as HTMLElement;
const purldbSection = document.getElementById('purldb-section') as HTMLElement;
const purldbPrompt = document.getElementById('purldb-prompt') as HTMLElement;
const purldbLoadButton = document.getElementById('purldb-load-button') as HTMLButtonElement;
const purldbLoading = document.getElementById('purldb-loading') as HTMLElement;
const purldbContent = document.getElementById('purldb-content') as HTMLElement;
const purldbError = document.getElementById('purldb-error') as HTMLElement;

// State for version expansion and parsed PURL
let currentVersions: PurlDBPackage[] = [];
let currentPurl: string = '';
let currentParsedPurl: PackageURL | null = null;

/**
 * Display error message
 */
function showError(message: string): void {
  resultSection.classList.remove('visible');
  errorResult.style.display = 'block';
  errorResult.innerHTML = `<p>${escapeHtml(message)}</p>`;
}

/**
 * Hide error message
 */
function hideError(): void {
  errorResult.style.display = 'none';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Display registry result
 */
function showRegistryResult(registry: RegistryResult): void {
  let html = '';

  if (registry.url) {
    html = `
      <p class="registry-name">${escapeHtml(registry.registryName)}</p>
      <a href="${escapeHtml(registry.url)}" class="registry-link" target="_blank" rel="noopener">
        ${escapeHtml(registry.url)}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8.75 1.5a.75.75 0 0 0 0 1.5h2.94L5.22 9.47a.75.75 0 0 0 1.06 1.06L12.75 4.06v2.94a.75.75 0 0 0 1.5 0v-5a.5.5 0 0 0-.5-.5h-5Z"/>
          <path d="M3.5 4.75a.25.25 0 0 1 .25-.25H6.5a.75.75 0 0 0 0-1.5H3.75A1.75 1.75 0 0 0 2 4.75v7.5c0 .966.784 1.75 1.75 1.75h7.5A1.75 1.75 0 0 0 13 12.25V9.5a.75.75 0 0 0-1.5 0v2.75a.25.25 0 0 1-.25.25h-7.5a.25.25 0 0 1-.25-.25v-7.5Z"/>
        </svg>
      </a>
    `;
    registryResult.className = 'registry-result success';
  } else {
    html = `
      <p class="registry-name">${escapeHtml(registry.registryName)}</p>
      <p class="registry-message">${escapeHtml(registry.message || 'No direct link available')}</p>
    `;
    registryResult.className = 'registry-result warning';
  }

  registryResult.innerHTML = html;
}

/**
 * Display VulnerableCode link
 */
function showVulnerableCodeResult(vcResult: VulnerableCodeResult): void {
  const html = `
    <p class="vulnerablecode-name">VulnerableCode</p>
    <a href="${escapeHtml(vcResult.url)}"
       class="vulnerablecode-link"
       target="_blank"
       rel="noopener"
       title="${escapeHtml(vcResult.description)}"
       aria-label="${escapeHtml(vcResult.label)} - ${escapeHtml(vcResult.description)}">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="shield-icon">
        <path d="M8 0L1 3v4.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V3L8 0zm0 1.5l5.5 2.3v3.7c0 3.7-2.5 6.2-5.5 7.5-3-1.3-5.5-3.8-5.5-7.5V3.8L8 1.5z"/>
        <path d="M7 9.5L5.5 8l-.7.7L7 10.9l4.2-4.2-.7-.7L7 9.5z"/>
      </svg>
      ${escapeHtml(vcResult.label)}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="external-icon">
        <path d="M8.75 1.5a.75.75 0 0 0 0 1.5h2.94L5.22 9.47a.75.75 0 0 0 1.06 1.06L12.75 4.06v2.94a.75.75 0 0 0 1.5 0v-5a.5.5 0 0 0-.5-.5h-5Z"/>
        <path d="M3.5 4.75a.25.25 0 0 1 .25-.25H6.5a.75.75 0 0 0 0-1.5H3.75A1.75 1.75 0 0 0 2 4.75v7.5c0 .966.784 1.75 1.75 1.75h7.5A1.75 1.75 0 0 0 13 12.25V9.5a.75.75 0 0 0-1.5 0v2.75a.25.25 0 0 1-.25.25h-7.5a.25.25 0 0 1-.25-.25v-7.5Z"/>
      </svg>
    </a>
  `;
  vulnerablecodeResult.innerHTML = html;
}

/**
 * Display PURL components table
 */
function showComponents(purl: PackageURL): void {
  const rows: Array<[string, string]> = [
    ['Type', purl.type],
    ['Name', purl.name],
  ];

  if (purl.namespace) {
    rows.splice(1, 0, ['Namespace', purl.namespace]);
  }

  if (purl.version) {
    rows.push(['Version', purl.version]);
  }

  if (purl.qualifiers && Object.keys(purl.qualifiers).length > 0) {
    const qualifiersStr = Object.entries(purl.qualifiers)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    rows.push(['Qualifiers', qualifiersStr]);
  }

  if (purl.subpath) {
    rows.push(['Subpath', purl.subpath]);
  }

  componentsBody.innerHTML = rows
    .map(([label, value]) => `
      <tr>
        <th>${escapeHtml(label)}</th>
        <td>${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');
}

/**
 * Update shareable URL
 */
function updateShareUrl(purlString: string): void {
  const url = new URL(window.location.href);
  url.searchParams.set('purl', purlString);
  shareInput.value = url.toString();
}

/**
 * Copy badge markdown to clipboard
 */
async function copyBadgeMarkdown(markdown: string, button: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(markdown);
    button.textContent = 'Copied!';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = 'Copy';
      button.classList.remove('copied');
    }, 2000);
  } catch {
    // Fallback for older browsers
    const tempInput = document.createElement('input');
    tempInput.value = markdown;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    button.textContent = 'Copied!';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = 'Copy';
      button.classList.remove('copied');
    }, 2000);
  }
}

/**
 * Display badges section
 */
function showBadges(badges: BadgeResult[]): void {
  const html = badges.map((badge, index) => `
    <div class="badge-item">
      <div class="badge-item-header">
        <span class="badge-label">${escapeHtml(badge.label)}</span>
        <div class="badge-preview">
          <a href="${escapeHtml(badge.linkUrl)}" target="_blank" rel="noopener" title="Preview badge link">
            <img src="${escapeHtml(badge.imageUrl)}" alt="PURL Viewer badge">
          </a>
        </div>
      </div>
      <div class="badge-markdown">
        <input type="text" class="badge-markdown-input" value="${escapeHtml(badge.markdown)}" readonly aria-label="Badge markdown for ${escapeHtml(badge.label)}">
        <button class="badge-copy-button" data-badge-index="${index}">Copy</button>
      </div>
    </div>
  `).join('');

  badgeContainer.innerHTML = html;

  // Add event listeners to copy buttons
  const copyButtons = badgeContainer.querySelectorAll('.badge-copy-button');
  copyButtons.forEach((btn) => {
    const button = btn as HTMLButtonElement;
    const index = parseInt(button.dataset.badgeIndex || '0', 10);
    button.addEventListener('click', () => {
      copyBadgeMarkdown(badges[index].markdown, button);
    });
  });
}

/**
 * Show PurlDB prompt (load button)
 */
function showPurlDBPrompt(): void {
  purldbSection.style.display = 'block';
  purldbPrompt.style.display = 'flex';
  purldbLoading.style.display = 'none';
  purldbContent.style.display = 'none';
  purldbError.style.display = 'none';
}

/**
 * Show PurlDB loading state
 */
function showPurlDBLoading(): void {
  purldbSection.style.display = 'block';
  purldbPrompt.style.display = 'none';
  purldbLoading.style.display = 'flex';
  purldbContent.style.display = 'none';
  purldbError.style.display = 'none';
}

/**
 * Show PurlDB content
 */
function showPurlDBContent(html: string): void {
  purldbPrompt.style.display = 'none';
  purldbLoading.style.display = 'none';
  purldbContent.innerHTML = html;
  purldbContent.style.display = 'block';
  purldbError.style.display = 'none';
}

/**
 * Show PurlDB error
 */
function showPurlDBError(message: string): void {
  purldbPrompt.style.display = 'none';
  purldbLoading.style.display = 'none';
  purldbContent.style.display = 'none';
  purldbError.textContent = message;
  purldbError.style.display = 'block';
}

/**
 * Hide PurlDB section
 */
function hidePurlDB(): void {
  purldbSection.style.display = 'none';
}

/**
 * Fetch and display PurlDB data (non-blocking)
 */
async function fetchAndDisplayPurlDBData(): Promise<void> {
  if (!currentPurl || !currentParsedPurl) {
    return;
  }

  showPurlDBLoading();

  try {
    // Fetch package data
    const pkg = await fetchPackageByPurl(currentPurl);

    // Fetch versions in parallel
    const versionsPromise = fetchPackageVersions(
      currentParsedPurl.type,
      currentParsedPurl.namespace || null,
      currentParsedPurl.name
    );

    // Get embedded dependencies from package data
    const dependencies: PurlDBDependency[] = pkg?.dependencies || [];

    // Wait for versions
    const versions = await versionsPromise;
    currentVersions = versions;

    // Render the section
    const html = renderPurlDBSection(pkg, versions, dependencies, currentPurl);
    showPurlDBContent(html);

    // Add event listeners for interactive elements
    setupPurlDBEventListeners();
  } catch (error) {
    console.error('PurlDB fetch error:', error);
    showPurlDBError('Failed to load package information from PurlDB');
  }
}

/**
 * Setup event listeners for PurlDB interactive elements
 */
function setupPurlDBEventListeners(): void {
  // Version click handler
  purldbContent.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;

    // Handle version link clicks
    const versionLink = target.closest('.version-link');
    if (versionLink) {
      e.preventDefault();
      const newPurl = versionLink.getAttribute('data-purl');
      if (newPurl && newPurl !== currentPurl) {
        purlInput.value = newPurl;
        handleParse();
      }
      return;
    }

    // Handle dependency link clicks
    const depLink = target.closest('.dependency-link');
    if (depLink) {
      e.preventDefault();
      const newPurl = depLink.getAttribute('data-purl');
      if (newPurl) {
        purlInput.value = newPurl;
        handleParse();
      }
      return;
    }

    // Handle "Show all versions" button
    if (target.classList.contains('version-show-all')) {
      const versionsContent = document.getElementById('purldb-versions-content');
      if (versionsContent) {
        const headingHtml = '<h3 class="purldb-heading">Available Versions</h3>';
        versionsContent.innerHTML = headingHtml + renderAllVersions(currentVersions, currentPurl);
      }
      return;
    }

    // Handle "Show fewer versions" button
    if (target.classList.contains('version-show-less')) {
      const versionsContent = document.getElementById('purldb-versions-content');
      if (versionsContent) {
        const headingHtml = '<h3 class="purldb-heading">Available Versions</h3>';
        versionsContent.innerHTML = headingHtml + renderVersionList(currentVersions, currentPurl);
      }
      return;
    }
  });
}

/**
 * Process and display PURL
 */
function processPurl(input: string): void {
  hideError();
  hidePurlDB();

  const result: ParseResult = parsePurl(input);

  if (!result.success) {
    showError(result.error.message);
    return;
  }

  // Store current PURL and parsed result for PurlDB loading
  currentPurl = input;
  currentParsedPurl = result.purl;

  const registry: RegistryResult = getRegistryUrl(result.purl);
  const vulnerablecode: VulnerableCodeResult = getVulnerableCodeUrl(input);
  const badges: BadgeResult[] = getBadges(input);

  showRegistryResult(registry);
  showVulnerableCodeResult(vulnerablecode);
  showBadges(badges);
  showComponents(result.purl);
  updateShareUrl(input);

  resultSection.classList.add('visible');

  // Show PurlDB load button (user can click to fetch data)
  showPurlDBPrompt();
}

/**
 * Copy share URL to clipboard
 */
async function copyShareUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(shareInput.value);
    copyButton.textContent = 'Copied!';
    copyButton.classList.add('copied');
    setTimeout(() => {
      copyButton.textContent = 'Copy';
      copyButton.classList.remove('copied');
    }, 2000);
  } catch {
    // Fallback for older browsers
    shareInput.select();
    document.execCommand('copy');
  }
}

/**
 * Handle parse button click
 */
function handleParse(): void {
  const input = purlInput.value.trim();
  if (input) {
    processPurl(input);
    // Update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set('purl', input);
    window.history.pushState({}, '', url.toString());
  }
}

/**
 * Initialize from URL parameters
 */
function initFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const purl = params.get('purl');
  if (purl) {
    purlInput.value = purl;
    processPurl(purl);
  }
}

// Event Listeners
parseButton.addEventListener('click', handleParse);

purlInput.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleParse();
  }
});

copyButton.addEventListener('click', copyShareUrl);

// PurlDB load button
purldbLoadButton.addEventListener('click', fetchAndDisplayPurlDBData);

// Handle browser back/forward
window.addEventListener('popstate', initFromUrl);

// Initialize on load
document.addEventListener('DOMContentLoaded', initFromUrl);

// Also run immediately in case DOM is already ready
if (document.readyState !== 'loading') {
  initFromUrl();
}
