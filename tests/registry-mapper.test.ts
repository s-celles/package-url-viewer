import { describe, it, expect } from 'vitest';
import { getRegistryUrl, getRegistryMapping } from '../site/assets/js/registry-mapper';
import { validPurlTestCases, edgeCaseTestCases } from './fixtures';
import { VALID_PURL_TYPES } from '../site/assets/js/types/registry-types';
import type { PackageURL } from '../site/assets/js/types/registry-types';

describe('getRegistryUrl', () => {
  describe('URL generation for all package types', () => {
    validPurlTestCases.forEach(({ expected, expectedUrl, description }) => {
      it(`should generate correct URL for ${description}`, () => {
        const result = getRegistryUrl(expected as PackageURL);

        expect(result.url).toBe(expectedUrl);
        expect(result.registryName).toBeTruthy();
      });
    });
  });

  describe('edge cases', () => {
    edgeCaseTestCases.forEach(({ expected, expectedUrl, description }) => {
      it(`should handle ${description}`, () => {
        const result = getRegistryUrl(expected as PackageURL);
        expect(result.url).toBe(expectedUrl);
      });
    });
  });

  describe('npm packages', () => {
    it('should handle scoped packages', () => {
      const result = getRegistryUrl({
        type: 'npm',
        name: 'core',
        namespace: 'angular',
        version: '15.0.0'
      });
      expect(result.url).toBe('https://www.npmjs.com/package/@angular/core/v/15.0.0');
    });

    it('should handle unscoped packages without version', () => {
      const result = getRegistryUrl({ type: 'npm', name: 'express' });
      expect(result.url).toBe('https://www.npmjs.com/package/express');
    });
  });

  describe('docker images', () => {
    it('should handle official images (library namespace)', () => {
      const result = getRegistryUrl({
        type: 'docker',
        name: 'nginx',
        namespace: 'library'
      });
      expect(result.url).toBe('https://hub.docker.com/_/nginx');
    });

    it('should handle official images without namespace', () => {
      const result = getRegistryUrl({ type: 'docker', name: 'nginx' });
      expect(result.url).toBe('https://hub.docker.com/_/nginx');
    });

    it('should handle non-official images', () => {
      const result = getRegistryUrl({
        type: 'docker',
        name: 'redis',
        namespace: 'bitnami'
      });
      expect(result.url).toBe('https://hub.docker.com/r/bitnami/redis');
    });
  });

  describe('maven packages', () => {
    it('should handle groupId and artifactId', () => {
      const result = getRegistryUrl({
        type: 'maven',
        name: 'junit-jupiter',
        namespace: 'org.junit.jupiter',
        version: '5.9.0'
      });
      expect(result.url).toBe('https://central.sonatype.com/artifact/org.junit.jupiter/junit-jupiter/5.9.0');
    });

    it('should fallback to search for missing namespace', () => {
      const result = getRegistryUrl({ type: 'maven', name: 'gson' });
      expect(result.url).toBe('https://central.sonatype.com/search?q=gson');
    });
  });

  describe('golang packages', () => {
    it('should construct full module path', () => {
      const result = getRegistryUrl({
        type: 'golang',
        name: 'gin',
        namespace: 'github.com/gin-gonic',
        version: 'v1.9.0'
      });
      expect(result.url).toBe('https://pkg.go.dev/github.com/gin-gonic/gin@v1.9.0');
    });

    it('should handle simple module without namespace', () => {
      const result = getRegistryUrl({ type: 'golang', name: 'errors' });
      expect(result.url).toBe('https://pkg.go.dev/errors');
    });
  });

  describe('julia packages', () => {
    it('should strip .jl suffix from package name', () => {
      const result = getRegistryUrl({
        type: 'julia',
        name: 'ToonFormat.jl'
      });
      expect(result.url).toBe('https://juliahub.com/ui/Packages/General/ToonFormat');
    });

    it('should handle package names without .jl suffix', () => {
      const result = getRegistryUrl({
        type: 'julia',
        name: 'DataFrames'
      });
      expect(result.url).toBe('https://juliahub.com/ui/Packages/General/DataFrames');
    });
  });

  describe('packages requiring namespace', () => {
    it('should return null URL for github without namespace', () => {
      const result = getRegistryUrl({ type: 'github', name: 'repo' });
      expect(result.url).toBeNull();
    });

    it('should return null URL for swift without namespace', () => {
      const result = getRegistryUrl({ type: 'swift', name: 'package' });
      expect(result.url).toBeNull();
    });

    it('should return null URL for vscode-extension without namespace', () => {
      const result = getRegistryUrl({ type: 'vscode-extension', name: 'extension' });
      expect(result.url).toBeNull();
    });
  });

  describe('packages with qualifiers', () => {
    it('should use distro qualifier for deb packages', () => {
      const result = getRegistryUrl({
        type: 'deb',
        name: 'curl',
        qualifiers: { distro: 'bookworm' }
      });
      expect(result.url).toBe('https://packages.debian.org/bookworm/curl');
    });

    it('should use repository_url qualifier when present', () => {
      const result = getRegistryUrl({
        type: 'oci',
        name: 'myimage',
        qualifiers: { repository_url: 'https://ghcr.io/owner/myimage' }
      });
      expect(result.url).toBe('https://ghcr.io/owner/myimage');
    });
  });

  describe('packages without registry', () => {
    it('should return null URL for generic type', () => {
      const result = getRegistryUrl({ type: 'generic', name: 'package' });
      expect(result.url).toBeNull();
      expect(result.hasRegistry).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it('should use download_url qualifier for generic if present', () => {
      const result = getRegistryUrl({
        type: 'generic',
        name: 'package',
        qualifiers: { download_url: 'https://example.com/package.tar.gz' }
      });
      expect(result.url).toBe('https://example.com/package.tar.gz');
    });
  });

  describe('unknown types', () => {
    it('should return appropriate result for unknown type', () => {
      const result = getRegistryUrl({ type: 'unknowntype', name: 'package' } as PackageURL);
      expect(result.url).toBeNull();
      expect(result.hasRegistry).toBe(false);
      expect(result.message).toContain('Unknown');
    });
  });
});

describe('getRegistryMapping', () => {
  it('should return mapping for all 38 official types', () => {
    VALID_PURL_TYPES.forEach(type => {
      const mapping = getRegistryMapping(type);
      expect(mapping).not.toBeNull();
      expect(mapping?.type).toBe(type);
      expect(mapping?.registryName).toBeTruthy();
    });
  });

  it('should return null for unknown types', () => {
    expect(getRegistryMapping('unknown')).toBeNull();
    expect(getRegistryMapping('')).toBeNull();
  });

  it('should have correct structure for known types', () => {
    const npmMapping = getRegistryMapping('npm');
    expect(npmMapping).toEqual({
      type: 'npm',
      registryName: 'npm',
      baseUrl: 'https://www.npmjs.com',
      hasRegistry: true
    });
  });

  it('should mark generic as having no registry', () => {
    const genericMapping = getRegistryMapping('generic');
    expect(genericMapping?.hasRegistry).toBe(false);
  });

  it('should mark deb as requiring qualifier', () => {
    const debMapping = getRegistryMapping('deb');
    expect(debMapping?.requiresQualifier).toBe(true);
  });
});
