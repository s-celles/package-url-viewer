import { parsePurl } from './purl-parser';
import { getRegistryUrl } from './registry-mapper';
import { getVulnerableCodeUrl } from './vulnerablecode';
import type { PackageURL, ParseResult, RegistryResult } from './types/registry-types';
import type { VulnerableCodeResult } from './vulnerablecode';

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
 * Process and display PURL
 */
function processPurl(input: string): void {
  hideError();

  const result: ParseResult = parsePurl(input);

  if (!result.success) {
    showError(result.error.message);
    return;
  }

  const registry: RegistryResult = getRegistryUrl(result.purl);
  const vulnerablecode: VulnerableCodeResult = getVulnerableCodeUrl(input);

  showRegistryResult(registry);
  showVulnerableCodeResult(vulnerablecode);
  showComponents(result.purl);
  updateShareUrl(input);

  resultSection.classList.add('visible');
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

// Handle browser back/forward
window.addEventListener('popstate', initFromUrl);

// Initialize on load
document.addEventListener('DOMContentLoaded', initFromUrl);

// Also run immediately in case DOM is already ready
if (document.readyState !== 'loading') {
  initFromUrl();
}
