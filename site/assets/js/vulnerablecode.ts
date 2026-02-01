/**
 * VulnerableCode integration module
 * Generates links to VulnerableCode vulnerability database searches
 */

const VULNERABLECODE_BASE_URL = 'https://public.vulnerablecode.io/packages/search';

/**
 * Result of VulnerableCode URL generation
 */
export interface VulnerableCodeResult {
  url: string;
  label: string;
  description: string;
}

/**
 * Generate VulnerableCode search URL for a parsed PURL
 * @param purlString - The PURL string to search for
 * @returns VulnerableCodeResult with URL, label, and description
 */
export function getVulnerableCodeUrl(purlString: string): VulnerableCodeResult {
  const encodedPurl = encodeURIComponent(purlString);

  return {
    url: `${VULNERABLECODE_BASE_URL}?search=${encodedPurl}`,
    label: 'Check vulnerabilities',
    description: 'Search for known vulnerabilities in VulnerableCode database'
  };
}
