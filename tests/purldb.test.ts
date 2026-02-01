import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchPackageByPurl,
  fetchPackageVersions,
  fetchDependencies,
  getPurlDBUrl,
  clearCache,
  PURLDB_API_URL,
  PURLDB_BASE_URL,
} from '../site/assets/js/purldb';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PurlDB API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constants', () => {
    it('should have correct base URL', () => {
      expect(PURLDB_BASE_URL).toBe('https://public.purldb.io');
    });

    it('should have correct API URL', () => {
      expect(PURLDB_API_URL).toBe('https://public.purldb.io/api/packages/');
    });
  });

  describe('getPurlDBUrl', () => {
    it('should generate correct URL for simple PURL', () => {
      const url = getPurlDBUrl('pkg:npm/lodash@4.17.21');
      expect(url).toBe(
        'https://public.purldb.io/api/packages/?purl=pkg%3Anpm%2Flodash%404.17.21'
      );
    });

    it('should encode special characters in PURL', () => {
      const url = getPurlDBUrl('pkg:npm/@scope/package@1.0.0');
      expect(url).toContain(encodeURIComponent('pkg:npm/@scope/package@1.0.0'));
    });
  });

  describe('fetchPackageByPurl', () => {
    it('should return package data for valid PURL', async () => {
      const mockPackage = {
        purl: 'pkg:npm/lodash@4.17.21',
        declared_license_expression_spdx: 'MIT',
        description: 'Lodash library',
        name: 'lodash',
        type: 'npm',
        version: '4.17.21',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          next: null,
          previous: null,
          results: [mockPackage],
        }),
      });

      const result = await fetchPackageByPurl('pkg:npm/lodash@4.17.21');

      expect(result).toEqual(mockPackage);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return null for unknown PURL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }),
      });

      const result = await fetchPackageByPurl('pkg:npm/nonexistent@1.0.0');

      expect(result).toBeNull();
    });

    it('should use cache for repeated queries', async () => {
      const mockPackage = {
        purl: 'pkg:npm/lodash@4.17.21',
        name: 'lodash',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          results: [mockPackage],
        }),
      });

      // First call
      const result1 = await fetchPackageByPurl('pkg:npm/lodash@4.17.21');
      // Second call (should use cache)
      const result2 = await fetchPackageByPurl('pkg:npm/lodash@4.17.21');

      expect(result1).toEqual(mockPackage);
      expect(result2).toEqual(mockPackage);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one fetch call
    });

    it('should return null on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await fetchPackageByPurl('pkg:npm/lodash@4.17.21');

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchPackageByPurl('pkg:npm/lodash@4.17.21');

      expect(result).toBeNull();
    });

    it('should handle timeout', async () => {
      // Create an AbortError
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await fetchPackageByPurl('pkg:npm/lodash@4.17.21');

      expect(result).toBeNull();
    });
  });

  describe('fetchPackageVersions', () => {
    it('should return array of versions', async () => {
      const mockVersions = [
        { purl: 'pkg:npm/lodash@4.17.21', version: '4.17.21' },
        { purl: 'pkg:npm/lodash@4.17.20', version: '4.17.20' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 2,
          next: null,
          results: mockVersions,
        }),
      });

      const result = await fetchPackageVersions('npm', null, 'lodash');

      expect(result).toEqual(mockVersions);
      expect(result.length).toBe(2);
    });

    it('should handle namespace correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          next: null,
          results: [{ purl: 'pkg:npm/@scope/pkg@1.0.0' }],
        }),
      });

      await fetchPackageVersions('npm', '@scope', 'pkg');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('namespace=%40scope'),
        expect.anything()
      );
    });

    it('should handle pagination', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            count: 2,
            next: 'https://public.purldb.io/api/packages/?page=2',
            results: [{ purl: 'pkg:npm/lodash@4.17.21' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            count: 2,
            next: null,
            results: [{ purl: 'pkg:npm/lodash@4.17.20' }],
          }),
        });

      const result = await fetchPackageVersions('npm', null, 'lodash');

      expect(result.length).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use cache for repeated queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          count: 1,
          next: null,
          results: [{ purl: 'pkg:npm/lodash@4.17.21' }],
        }),
      });

      await fetchPackageVersions('npm', null, 'lodash');
      await fetchPackageVersions('npm', null, 'lodash');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchPackageVersions('npm', null, 'lodash');

      expect(result).toEqual([]);
    });
  });

  describe('fetchDependencies', () => {
    it('should return array of dependencies', async () => {
      const mockDeps = [
        { purl: 'pkg:npm/dep1@1.0.0', scope: 'runtime', is_runtime: true, is_optional: false },
        { purl: 'pkg:npm/dep2@2.0.0', scope: 'dev', is_runtime: false, is_optional: false },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeps,
      });

      const result = await fetchDependencies('https://api.example.com/deps');

      expect(result).toEqual(mockDeps);
    });

    it('should handle paginated response', async () => {
      const mockDeps = [
        { purl: 'pkg:npm/dep1@1.0.0', scope: 'runtime' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: mockDeps,
        }),
      });

      const result = await fetchDependencies('https://api.example.com/deps');

      expect(result).toEqual(mockDeps);
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchDependencies('https://api.example.com/deps');

      expect(result).toEqual([]);
    });

    it('should use cache for repeated queries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ purl: 'pkg:npm/dep@1.0.0' }],
      });

      const url = 'https://api.example.com/deps/unique';
      await fetchDependencies(url);
      await fetchDependencies(url);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    it('should clear all caches', async () => {
      // Populate cache
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          count: 1,
          next: null,
          results: [{ purl: 'pkg:npm/test@1.0.0' }],
        }),
      });

      await fetchPackageByPurl('pkg:npm/test@1.0.0');
      clearCache();

      // Should fetch again after clear
      await fetchPackageByPurl('pkg:npm/test@1.0.0');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
