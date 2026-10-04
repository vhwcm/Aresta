import { describe, it, expect, vi } from 'vitest';
import { optimizeImageFile, MAX_IMAGE_DIMENSION } from '~/utils/imageOptimizer';

describe('imageOptimizer Utility', () => {
  it('preserves SVG files as pure vector data URLs without canvas rasterization', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="5"/></svg>';
    const file = new File([svgContent], 'test-icon.svg', { type: 'image/svg+xml' });

    const result = await optimizeImageFile(file);
    expect(result.dataUrl).toContain('data:image/svg+xml');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.originalSize).toBe(file.size);
  });

  it('handles small raster image files gracefully', async () => {
    const dummyBlob = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const file = new File([dummyBlob], 'small-dot.png', { type: 'image/png' });

    const result = await optimizeImageFile(file);
    expect(result.dataUrl).toContain('data:image/png');
    expect(result.originalSize).toBe(file.size);
  });

  it('provides safe fallback dimensions if Image loading fails in headless environment', async () => {
    const dummyContent = 'corrupted-content';
    const file = new File([dummyContent], 'corrupted.jpg', { type: 'image/jpeg' });

    const result = await optimizeImageFile(file);
    expect(result.dataUrl).toBeTruthy();
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });
});
