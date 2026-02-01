import { describe, it, expect } from 'vitest';
import {
  renderLicenseInfo,
  renderVersionList,
  renderAllVersions,
  renderMetadata,
  renderDependencies,
  getPurlDBDisplayUrl,
  renderPurlDBLink,
  renderPurlDBSection,
} from '../site/assets/js/purldb-display';
import type { PurlDBPackage, PurlDBDependency } from '../site/assets/js/types/purldb-types';

// Helper to create mock package
function createMockPackage(overrides: Partial<PurlDBPackage> = {}): PurlDBPackage {
  return {
    url: 'https://public.purldb.io/api/packages/1/',
    purl: 'pkg:npm/lodash@4.17.21',
    type: 'npm',
    namespace: null,
    name: 'lodash',
    version: '4.17.21',
    declared_license_expression: 'MIT License',
    declared_license_expression_spdx: 'MIT',
    description: 'A modern JavaScript utility library',
    homepage_url: 'https://lodash.com/',
    repository_homepage_url: 'https://github.com/lodash/lodash',
    release_date: '2021-02-20',
    keywords: ['modules', 'stdlib', 'util'],
    dependencies: [],
    parties: [],
    ...overrides,
  };
}

describe('PurlDB Display Module', () => {
  describe('renderLicenseInfo', () => {
    it('should display SPDX license when available', () => {
      const pkg = createMockPackage({
        declared_license_expression_spdx: 'MIT',
        declared_license_expression: 'MIT License',
      });

      const result = renderLicenseInfo(pkg);

      expect(result).toContain('MIT');
      expect(result).toContain('license-badge');
    });

    it('should fall back to declared license when SPDX not available', () => {
      const pkg = createMockPackage({
        declared_license_expression_spdx: null,
        declared_license_expression: 'Apache License 2.0',
      });

      const result = renderLicenseInfo(pkg);

      expect(result).toContain('Apache License 2.0');
      expect(result).toContain('license-badge');
    });

    it('should show unavailable message when no license', () => {
      const pkg = createMockPackage({
        declared_license_expression_spdx: null,
        declared_license_expression: null,
      });

      const result = renderLicenseInfo(pkg);

      expect(result).toContain('License information not available');
      expect(result).toContain('purldb-empty');
    });

    it('should handle null package', () => {
      const result = renderLicenseInfo(null);

      expect(result).toContain('License information not available');
      expect(result).toContain('purldb-empty');
    });
  });

  describe('renderVersionList', () => {
    it('should render list of versions', () => {
      const versions: PurlDBPackage[] = [
        createMockPackage({ purl: 'pkg:npm/lodash@4.17.21', version: '4.17.21' }),
        createMockPackage({ purl: 'pkg:npm/lodash@4.17.20', version: '4.17.20' }),
      ];

      const result = renderVersionList(versions, 'pkg:npm/lodash@4.17.21');

      expect(result).toContain('4.17.21');
      expect(result).toContain('4.17.20');
      expect(result).toContain('version-list');
    });

    it('should highlight current version', () => {
      const versions: PurlDBPackage[] = [
        createMockPackage({ purl: 'pkg:npm/lodash@4.17.21', version: '4.17.21' }),
      ];

      const result = renderVersionList(versions, 'pkg:npm/lodash@4.17.21');

      expect(result).toContain('version-current');
      expect(result).toContain('aria-current="true"');
    });

    it('should include data-purl attribute for navigation', () => {
      const versions: PurlDBPackage[] = [
        createMockPackage({ purl: 'pkg:npm/lodash@4.17.21', version: '4.17.21' }),
      ];

      const result = renderVersionList(versions, 'pkg:npm/other@1.0.0');

      expect(result).toContain('data-purl="pkg:npm/lodash@4.17.21"');
    });

    it('should show "Show all" button when more than 10 versions', () => {
      const versions: PurlDBPackage[] = Array.from({ length: 15 }, (_, i) =>
        createMockPackage({
          purl: `pkg:npm/lodash@4.17.${i}`,
          version: `4.17.${i}`,
        })
      );

      const result = renderVersionList(versions, 'pkg:npm/lodash@4.17.0');

      expect(result).toContain('version-show-all');
      expect(result).toContain('Show all 15 versions');
    });

    it('should not show "Show all" button when 10 or fewer versions', () => {
      const versions: PurlDBPackage[] = Array.from({ length: 5 }, (_, i) =>
        createMockPackage({
          purl: `pkg:npm/lodash@4.17.${i}`,
          version: `4.17.${i}`,
        })
      );

      const result = renderVersionList(versions, 'pkg:npm/lodash@4.17.0');

      expect(result).not.toContain('version-show-all');
    });

    it('should handle empty versions array', () => {
      const result = renderVersionList([], 'pkg:npm/lodash@4.17.21');

      expect(result).toContain('No version information available');
    });

    it('should filter out versions without version number', () => {
      const versions: PurlDBPackage[] = [
        createMockPackage({ purl: 'pkg:npm/lodash@4.17.21', version: '4.17.21' }),
        createMockPackage({ purl: 'pkg:npm/lodash', version: null }),
      ];

      const result = renderVersionList(versions, 'pkg:npm/lodash@4.17.21');

      expect(result).toContain('4.17.21');
      expect(result).not.toContain('null');
    });

    it('should sort versions by release date (newest first)', () => {
      const versions: PurlDBPackage[] = [
        createMockPackage({
          purl: 'pkg:npm/lodash@4.17.20',
          version: '4.17.20',
          release_date: '2020-01-01',
        }),
        createMockPackage({
          purl: 'pkg:npm/lodash@4.17.21',
          version: '4.17.21',
          release_date: '2021-02-20',
        }),
      ];

      const result = renderVersionList(versions, 'pkg:npm/other@1.0.0');

      // 4.17.21 should appear before 4.17.20
      const idx21 = result.indexOf('4.17.21');
      const idx20 = result.indexOf('4.17.20');
      expect(idx21).toBeLessThan(idx20);
    });
  });

  describe('renderAllVersions', () => {
    it('should render all versions without limit', () => {
      const versions: PurlDBPackage[] = Array.from({ length: 15 }, (_, i) =>
        createMockPackage({
          purl: `pkg:npm/lodash@4.17.${i}`,
          version: `4.17.${i}`,
        })
      );

      const result = renderAllVersions(versions, 'pkg:npm/lodash@4.17.0');

      // Should contain all 15 versions
      for (let i = 0; i < 15; i++) {
        expect(result).toContain(`4.17.${i}`);
      }
    });

    it('should include "Show fewer" button', () => {
      const versions: PurlDBPackage[] = [
        createMockPackage({ version: '1.0.0' }),
      ];

      const result = renderAllVersions(versions, 'pkg:npm/test@1.0.0');

      expect(result).toContain('version-show-less');
    });
  });

  describe('renderMetadata', () => {
    it('should display all metadata fields when available', () => {
      const pkg = createMockPackage();

      const result = renderMetadata(pkg);

      expect(result).toContain('A modern JavaScript utility library');
      expect(result).toContain('https://lodash.com/');
      expect(result).toContain('https://github.com/lodash/lodash');
      expect(result).toContain('Feb 20, 2021'); // Formatted date
      expect(result).toContain('modules');
      expect(result).toContain('stdlib');
    });

    it('should make URLs clickable with target="_blank"', () => {
      const pkg = createMockPackage();

      const result = renderMetadata(pkg);

      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener"');
    });

    it('should handle missing fields gracefully', () => {
      const pkg = createMockPackage({
        description: null,
        homepage_url: null,
        repository_homepage_url: null,
        release_date: null,
        keywords: [],
      });

      const result = renderMetadata(pkg);

      expect(result).toContain('Package details not available');
    });

    it('should handle null package', () => {
      const result = renderMetadata(null);

      expect(result).toContain('Package details not available');
    });

    it('should render keywords as tags', () => {
      const pkg = createMockPackage({
        keywords: ['testing', 'utilities'],
      });

      const result = renderMetadata(pkg);

      expect(result).toContain('keyword-tag');
      expect(result).toContain('testing');
      expect(result).toContain('utilities');
    });

    it('should escape HTML in metadata', () => {
      const pkg = createMockPackage({
        description: '<script>alert("xss")</script>',
      });

      const result = renderMetadata(pkg);

      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });
  });

  describe('renderDependencies', () => {
    it('should render list of dependencies', () => {
      const deps: PurlDBDependency[] = [
        { purl: 'pkg:npm/dep1@1.0.0', scope: 'runtime', is_runtime: true, is_optional: false },
        { purl: 'pkg:npm/dep2@2.0.0', scope: 'dev', is_runtime: false, is_optional: false },
      ];

      const result = renderDependencies(deps);

      expect(result).toContain('pkg:npm/dep1@1.0.0');
      expect(result).toContain('pkg:npm/dep2@2.0.0');
      expect(result).toContain('dependency-list');
    });

    it('should group dependencies by scope', () => {
      const deps: PurlDBDependency[] = [
        { purl: 'pkg:npm/runtime1@1.0.0', scope: 'runtime', is_runtime: true, is_optional: false },
        { purl: 'pkg:npm/dev1@1.0.0', scope: 'dev', is_runtime: false, is_optional: false },
      ];

      const result = renderDependencies(deps);

      expect(result).toContain('runtime');
      expect(result).toContain('dev');
      expect(result).toContain('dependency-group');
    });

    it('should show optional badge for optional dependencies', () => {
      const deps: PurlDBDependency[] = [
        { purl: 'pkg:npm/optional@1.0.0', scope: 'runtime', is_runtime: true, is_optional: true },
      ];

      const result = renderDependencies(deps);

      expect(result).toContain('dep-optional');
      expect(result).toContain('optional');
    });

    it('should include data-purl for navigation', () => {
      const deps: PurlDBDependency[] = [
        { purl: 'pkg:npm/dep@1.0.0', scope: 'runtime', is_runtime: true, is_optional: false },
      ];

      const result = renderDependencies(deps);

      expect(result).toContain('data-purl="pkg:npm/dep@1.0.0"');
      expect(result).toContain('dependency-link');
    });

    it('should handle empty dependencies', () => {
      const result = renderDependencies([]);

      expect(result).toContain('No dependencies found');
    });

    it('should show count per scope', () => {
      const deps: PurlDBDependency[] = [
        { purl: 'pkg:npm/dep1@1.0.0', scope: 'runtime', is_runtime: true, is_optional: false },
        { purl: 'pkg:npm/dep2@1.0.0', scope: 'runtime', is_runtime: true, is_optional: false },
      ];

      const result = renderDependencies(deps);

      expect(result).toContain('(2)');
    });
  });

  describe('getPurlDBDisplayUrl', () => {
    it('should generate correct URL', () => {
      const url = getPurlDBDisplayUrl('pkg:npm/lodash@4.17.21');

      expect(url).toBe(
        'https://public.purldb.io/api/packages/?purl=pkg%3Anpm%2Flodash%404.17.21'
      );
    });

    it('should encode special characters', () => {
      const url = getPurlDBDisplayUrl('pkg:npm/@scope/package@1.0.0');

      expect(url).toContain(encodeURIComponent('@scope'));
    });
  });

  describe('renderPurlDBLink', () => {
    it('should render link with correct URL', () => {
      const result = renderPurlDBLink('pkg:npm/lodash@4.17.21');

      expect(result).toContain('View on PurlDB');
      expect(result).toContain('purldb-link');
      expect(result).toContain('target="_blank"');
    });

    it('should include external link icon', () => {
      const result = renderPurlDBLink('pkg:npm/lodash@4.17.21');

      expect(result).toContain('external-icon');
      expect(result).toContain('<svg');
    });
  });

  describe('renderPurlDBSection', () => {
    it('should render complete section with all subsections', () => {
      const pkg = createMockPackage();
      const versions = [pkg];
      const deps: PurlDBDependency[] = [];

      const result = renderPurlDBSection(pkg, versions, deps, 'pkg:npm/lodash@4.17.21');

      expect(result).toContain('purldb-link-section');
      expect(result).toContain('purldb-license-content');
      expect(result).toContain('purldb-versions-content');
      expect(result).toContain('purldb-metadata-content');
      expect(result).toContain('purldb-dependencies-content');
    });

    it('should include all headings', () => {
      const pkg = createMockPackage();

      const result = renderPurlDBSection(pkg, [], [], 'pkg:npm/lodash@4.17.21');

      expect(result).toContain('License');
      expect(result).toContain('Available Versions');
      expect(result).toContain('Package Details');
      expect(result).toContain('Dependencies');
    });

    it('should handle null package gracefully', () => {
      const result = renderPurlDBSection(null, [], [], 'pkg:npm/unknown@1.0.0');

      expect(result).toContain('License information not available');
      expect(result).toContain('Package details not available');
    });
  });
});
