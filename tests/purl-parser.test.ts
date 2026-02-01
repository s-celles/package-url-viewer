import { describe, it, expect } from 'vitest';
import { parsePurl, isValidPurlType } from '../site/assets/js/purl-parser';
import { validPurlTestCases, invalidPurlTestCases, edgeCaseTestCases } from './fixtures';
import { VALID_PURL_TYPES } from '../site/assets/js/types/registry-types';

describe('parsePurl', () => {
  describe('valid PURLs', () => {
    validPurlTestCases.forEach(({ input, expected, description }) => {
      it(`should parse ${description}: ${input}`, () => {
        const result = parsePurl(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.purl.type).toBe(expected.type);
          expect(result.purl.name).toBe(expected.name);

          if (expected.namespace) {
            expect(result.purl.namespace).toBe(expected.namespace);
          }
          if (expected.version) {
            expect(result.purl.version).toBe(expected.version);
          }
          if (expected.qualifiers) {
            expect(result.purl.qualifiers).toEqual(expected.qualifiers);
          }
          if (expected.subpath) {
            expect(result.purl.subpath).toBe(expected.subpath);
          }
        }
      });
    });
  });

  describe('edge cases', () => {
    edgeCaseTestCases.forEach(({ input, expected, description }) => {
      it(`should handle ${description}: ${input}`, () => {
        const result = parsePurl(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.purl.type).toBe(expected.type);
          expect(result.purl.name).toBe(expected.name);
        }
      });
    });
  });

  describe('invalid PURLs', () => {
    invalidPurlTestCases.forEach(({ input, expectedErrorCode, description }) => {
      it(`should reject ${description}: "${input}"`, () => {
        const result = parsePurl(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe(expectedErrorCode);
          expect(result.error.message).toBeTruthy();
        }
      });
    });
  });

  describe('whitespace handling', () => {
    it('should trim leading whitespace', () => {
      const result = parsePurl('  pkg:npm/lodash');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.purl.name).toBe('lodash');
      }
    });

    it('should trim trailing whitespace', () => {
      const result = parsePurl('pkg:npm/lodash  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.purl.name).toBe('lodash');
      }
    });
  });
});

describe('isValidPurlType', () => {
  it('should return true for all 38 official PURL types', () => {
    VALID_PURL_TYPES.forEach(type => {
      expect(isValidPurlType(type)).toBe(true);
    });
  });

  it('should return false for unknown types', () => {
    expect(isValidPurlType('unknown')).toBe(false);
    expect(isValidPurlType('foobar')).toBe(false);
    expect(isValidPurlType('')).toBe(false);
  });

  it('should be case-sensitive', () => {
    expect(isValidPurlType('NPM')).toBe(false);
    expect(isValidPurlType('Npm')).toBe(false);
    expect(isValidPurlType('npm')).toBe(true);
  });
});
