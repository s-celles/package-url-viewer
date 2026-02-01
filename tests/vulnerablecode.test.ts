import { describe, it, expect } from 'vitest';
import { getVulnerableCodeUrl } from '../site/assets/js/vulnerablecode';

describe('getVulnerableCodeUrl', () => {
  describe('URL generation', () => {
    it('should generate correct VulnerableCode URL for simple PURL', () => {
      const result = getVulnerableCodeUrl('pkg:npm/lodash');
      expect(result.url).toBe('https://public.vulnerablecode.io/packages/search?search=pkg%3Anpm%2Flodash');
    });

    it('should generate correct VulnerableCode URL with version', () => {
      const result = getVulnerableCodeUrl('pkg:pypi/requests@2.28.0');
      expect(result.url).toBe('https://public.vulnerablecode.io/packages/search?search=pkg%3Apypi%2Frequests%402.28.0');
    });

    it('should generate correct VulnerableCode URL without version', () => {
      const result = getVulnerableCodeUrl('pkg:pypi/requests');
      expect(result.url).toBe('https://public.vulnerablecode.io/packages/search?search=pkg%3Apypi%2Frequests');
    });

    it('should URL-encode special characters correctly', () => {
      const result = getVulnerableCodeUrl('pkg:maven/org.apache.logging.log4j/log4j-core@2.17.1');
      expect(result.url).toContain('pkg%3Amaven%2Forg.apache.logging.log4j%2Flog4j-core%402.17.1');
    });

    it('should handle namespaced packages', () => {
      const result = getVulnerableCodeUrl('pkg:npm/@angular/core@15.0.0');
      expect(result.url).toBe('https://public.vulnerablecode.io/packages/search?search=pkg%3Anpm%2F%40angular%2Fcore%4015.0.0');
    });

    it('should handle cargo packages', () => {
      const result = getVulnerableCodeUrl('pkg:cargo/serde@1.0.152');
      expect(result.url).toBe('https://public.vulnerablecode.io/packages/search?search=pkg%3Acargo%2Fserde%401.0.152');
    });

    it('should handle docker packages', () => {
      const result = getVulnerableCodeUrl('pkg:docker/library/nginx@1.23');
      expect(result.url).toBe('https://public.vulnerablecode.io/packages/search?search=pkg%3Adocker%2Flibrary%2Fnginx%401.23');
    });

    it('should handle golang packages with namespace', () => {
      const result = getVulnerableCodeUrl('pkg:golang/github.com/gin-gonic/gin@v1.9.0');
      expect(result.url).toContain('pkg%3Agolang%2Fgithub.com%2Fgin-gonic%2Fgin%40v1.9.0');
    });
  });

  describe('label and description', () => {
    it('should return correct label', () => {
      const result = getVulnerableCodeUrl('pkg:npm/lodash');
      expect(result.label).toBe('Check vulnerabilities');
    });

    it('should return correct description', () => {
      const result = getVulnerableCodeUrl('pkg:npm/lodash');
      expect(result.description).toBe('Search for known vulnerabilities in VulnerableCode database');
    });

    it('should include label for any PURL type', () => {
      const types = ['npm', 'pypi', 'maven', 'cargo', 'gem'];
      types.forEach(type => {
        const result = getVulnerableCodeUrl(`pkg:${type}/test-package`);
        expect(result.label).toBeTruthy();
        expect(result.description).toBeTruthy();
      });
    });
  });
});
