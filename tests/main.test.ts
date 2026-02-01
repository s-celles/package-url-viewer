import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('URL Parameter Handling', () => {
  beforeEach(() => {
    vi.stubGlobal('location', {
      href: 'http://localhost:3000/',
      search: '',
      origin: 'http://localhost:3000',
      pathname: '/'
    });
  });

  describe('URL Search Params', () => {
    it('should parse purl from query string', () => {
      const params = new URLSearchParams('?purl=pkg:npm/lodash@4.17.21');
      expect(params.get('purl')).toBe('pkg:npm/lodash@4.17.21');
    });

    it('should handle encoded characters in PURL', () => {
      const params = new URLSearchParams('?purl=pkg:npm/%40types/node@18.0.0');
      expect(params.get('purl')).toBe('pkg:npm/@types/node@18.0.0');
    });

    it('should handle empty purl parameter', () => {
      const params = new URLSearchParams('?purl=');
      expect(params.get('purl')).toBe('');
    });

    it('should return null when purl parameter is missing', () => {
      const params = new URLSearchParams('?other=value');
      expect(params.get('purl')).toBeNull();
    });

    it('should handle multiple query parameters', () => {
      const params = new URLSearchParams('?foo=bar&purl=pkg:cargo/serde@1.0.0&baz=qux');
      expect(params.get('purl')).toBe('pkg:cargo/serde@1.0.0');
    });
  });

  describe('URL Building', () => {
    it('should build shareable URL with purl parameter', () => {
      const url = new URL('http://localhost:3000/');
      url.searchParams.set('purl', 'pkg:npm/lodash@4.17.21');
      expect(url.toString()).toBe('http://localhost:3000/?purl=pkg%3Anpm%2Flodash%404.17.21');
    });

    it('should properly encode special characters', () => {
      const url = new URL('http://localhost:3000/');
      url.searchParams.set('purl', 'pkg:npm/@types/node@18.0.0');
      const decodedPurl = new URL(url.toString()).searchParams.get('purl');
      expect(decodedPurl).toBe('pkg:npm/@types/node@18.0.0');
    });

    it('should handle maven packages with namespace', () => {
      const url = new URL('http://localhost:3000/');
      url.searchParams.set('purl', 'pkg:maven/org.apache.commons/commons-lang3@3.12.0');
      const decodedPurl = new URL(url.toString()).searchParams.get('purl');
      expect(decodedPurl).toBe('pkg:maven/org.apache.commons/commons-lang3@3.12.0');
    });

    it('should handle PURLs with qualifiers', () => {
      const url = new URL('http://localhost:3000/');
      url.searchParams.set('purl', 'pkg:deb/debian/curl@7.88.1?distro=bookworm');
      const decodedPurl = new URL(url.toString()).searchParams.get('purl');
      expect(decodedPurl).toBe('pkg:deb/debian/curl@7.88.1?distro=bookworm');
    });

    it('should handle PURLs with subpath', () => {
      const url = new URL('http://localhost:3000/');
      url.searchParams.set('purl', 'pkg:github/lodash/lodash#core');
      const decodedPurl = new URL(url.toString()).searchParams.get('purl');
      expect(decodedPurl).toBe('pkg:github/lodash/lodash#core');
    });
  });
});
