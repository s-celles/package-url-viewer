import { describe, it, expect } from 'vitest';
import { stripVersion, hasVersion, generateBadge, getBadges } from '../site/assets/js/badges';

describe('badges', () => {
  describe('stripVersion', () => {
    it('should strip version from simple PURL', () => {
      expect(stripVersion('pkg:npm/lodash@4.17.21')).toBe('pkg:npm/lodash');
    });

    it('should return unchanged PURL if no version', () => {
      expect(stripVersion('pkg:npm/lodash')).toBe('pkg:npm/lodash');
    });

    it('should handle scoped npm packages', () => {
      expect(stripVersion('pkg:npm/@angular/core@15.0.0')).toBe('pkg:npm/@angular/core');
    });

    it('should handle scoped packages without version', () => {
      expect(stripVersion('pkg:npm/@angular/core')).toBe('pkg:npm/@angular/core');
    });

    it('should handle namespaced packages (maven)', () => {
      expect(stripVersion('pkg:maven/org.apache.commons/commons-lang3@3.12.0')).toBe('pkg:maven/org.apache.commons/commons-lang3');
    });

    it('should handle pypi packages', () => {
      expect(stripVersion('pkg:pypi/requests@2.28.0')).toBe('pkg:pypi/requests');
    });

    it('should preserve qualifiers when stripping version', () => {
      expect(stripVersion('pkg:npm/lodash@4.17.21?repository_url=https://example.com')).toBe('pkg:npm/lodash?repository_url=https://example.com');
    });

    it('should preserve subpath when stripping version', () => {
      expect(stripVersion('pkg:npm/lodash@4.17.21#dist/lodash.js')).toBe('pkg:npm/lodash#dist/lodash.js');
    });
  });

  describe('hasVersion', () => {
    it('should return true for PURL with version', () => {
      expect(hasVersion('pkg:npm/lodash@4.17.21')).toBe(true);
    });

    it('should return false for PURL without version', () => {
      expect(hasVersion('pkg:npm/lodash')).toBe(false);
    });

    it('should return true for scoped package with version', () => {
      expect(hasVersion('pkg:npm/@angular/core@15.0.0')).toBe(true);
    });

    it('should return false for scoped package without version', () => {
      expect(hasVersion('pkg:npm/@angular/core')).toBe(false);
    });
  });

  describe('generateBadge', () => {
    it('should generate correct badge for versioned variant', () => {
      const result = generateBadge('pkg:npm/lodash@4.17.21', 'versioned');

      expect(result.imageUrl).toBe('https://img.shields.io/badge/PURL-viewer-blue');
      expect(result.linkUrl).toBe('https://s-celles.github.io/package-url-viewer/?purl=pkg%3Anpm%2Flodash%404.17.21');
      expect(result.markdown).toBe('[![PURL Viewer](https://img.shields.io/badge/PURL-viewer-blue)](https://s-celles.github.io/package-url-viewer/?purl=pkg%3Anpm%2Flodash%404.17.21)');
      expect(result.label).toBe('Current version');
      expect(result.purlDisplay).toBe('pkg:npm/lodash@4.17.21');
    });

    it('should generate correct badge for latest variant', () => {
      const result = generateBadge('pkg:npm/lodash@4.17.21', 'latest');

      expect(result.imageUrl).toBe('https://img.shields.io/badge/PURL-viewer-blue');
      expect(result.linkUrl).toBe('https://s-celles.github.io/package-url-viewer/?purl=pkg%3Anpm%2Flodash');
      expect(result.markdown).toBe('[![PURL Viewer](https://img.shields.io/badge/PURL-viewer-blue)](https://s-celles.github.io/package-url-viewer/?purl=pkg%3Anpm%2Flodash)');
      expect(result.label).toBe('Latest');
      expect(result.purlDisplay).toBe('pkg:npm/lodash');
    });

    it('should URL-encode special characters correctly', () => {
      const result = generateBadge('pkg:maven/org.apache.commons/commons-lang3@3.12.0', 'versioned');

      expect(result.linkUrl).toContain('pkg%3Amaven%2Forg.apache.commons%2Fcommons-lang3%403.12.0');
    });

    it('should handle scoped npm packages', () => {
      const result = generateBadge('pkg:npm/@angular/core@15.0.0', 'versioned');

      expect(result.linkUrl).toContain('pkg%3Anpm%2F%40angular%2Fcore%4015.0.0');
      expect(result.purlDisplay).toBe('pkg:npm/@angular/core@15.0.0');
    });
  });

  describe('getBadges', () => {
    it('should return two badges for PURL with version', () => {
      const badges = getBadges('pkg:npm/lodash@4.17.21');

      expect(badges).toHaveLength(2);
      expect(badges[0].label).toBe('Current version');
      expect(badges[1].label).toBe('Latest');
    });

    it('should return one badge for PURL without version', () => {
      const badges = getBadges('pkg:npm/lodash');

      expect(badges).toHaveLength(1);
      expect(badges[0].label).toBe('Latest');
    });

    it('should return correct badge data for versioned PURL', () => {
      const badges = getBadges('pkg:pypi/requests@2.28.0');

      expect(badges[0].purlDisplay).toBe('pkg:pypi/requests@2.28.0');
      expect(badges[1].purlDisplay).toBe('pkg:pypi/requests');
    });

    it('should handle scoped packages correctly', () => {
      const badges = getBadges('pkg:npm/@angular/core@15.0.0');

      expect(badges).toHaveLength(2);
      expect(badges[0].purlDisplay).toBe('pkg:npm/@angular/core@15.0.0');
      expect(badges[1].purlDisplay).toBe('pkg:npm/@angular/core');
    });
  });
});
