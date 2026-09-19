import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  openExternalUrl,
  extractDomain,
  getFaviconUrl,
  cleanUrlTitle,
  sanitizeUrl
} from '~/utils/urlOpener';

describe('urlOpener utility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('sanitizeUrl', () => {
    it('should add https:// prefix if missing', () => {
      expect(sanitizeUrl('google.com')).toBe('https://google.com');
      expect(sanitizeUrl('example.org/path')).toBe('https://example.org/path');
    });

    it('should preserve existing http and https protocols', () => {
      expect(sanitizeUrl('http://insecure.site')).toBe('http://insecure.site');
      expect(sanitizeUrl('https://secure.site')).toBe('https://secure.site');
    });

    it('should handle whitespace and invalid inputs gracefully', () => {
      expect(sanitizeUrl('   ')).toBe('');
      expect(sanitizeUrl('')).toBe('');
    });
  });

  describe('extractDomain', () => {
    it('should extract hostname cleanly from URL', () => {
      expect(extractDomain('https://www.github.com/aresta/repo')).toBe('github.com');
      expect(extractDomain('http://docs.vuejs.org/guide')).toBe('docs.vuejs.org');
      expect(extractDomain('invalid-url')).toBe('invalid-url');
    });
  });

  describe('getFaviconUrl', () => {
    it('should return Google Favicon service URL for a valid domain', () => {
      const favicon = getFaviconUrl('https://github.com');
      expect(favicon).toContain('google.com/s2/favicons');
      expect(favicon).toContain('domain=github.com');
    });
  });

  describe('cleanUrlTitle', () => {
    it('should use provided title if available', () => {
      expect(cleanUrlTitle('https://github.com', 'GitHub Oficial')).toBe('GitHub Oficial');
    });

    it('should fallback to domain or URL when title is empty', () => {
      expect(cleanUrlTitle('https://github.com/aresta', '')).toBe('github.com');
    });
  });

  describe('openExternalUrl', () => {
    it('should call window.open with _blank and noopener in browser environment', async () => {
      const windowOpenSpy = vi.fn();
      vi.stubGlobal('window', {
        open: windowOpenSpy,
        location: { href: 'http://localhost' }
      });

      await openExternalUrl('https://aresta.app');

      expect(windowOpenSpy).toHaveBeenCalledWith(
        'https://aresta.app',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });
});
