import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildLocalGraph } from '~/utils/buildLocalGraph';
import { openExternalUrl, sanitizeUrl, cleanUrlTitle, extractDomain } from '~/utils/urlOpener';
import type { LocalLinkItem, LocalNote, LocalCanvasItem } from '~/adapters/database/types';

describe('Canvas and Graph Links Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('buildLocalGraph should include link nodes and connect to source note', () => {
    const notes: LocalNote[] = [
      {
        id: 'note-1',
        title: 'Estudos Vue',
        content: 'Links úteis para o projeto',
        updated_at: '2026-09-19T17:00:00.000Z',
        sync_status: 'synced',
      },
    ];

    const links: LocalLinkItem[] = [
      {
        id: 'link-101',
        url: 'https://nuxt.com',
        title: 'Documentação Nuxt',
        domain: 'nuxt.com',
        sourceNoteId: 'note-1',
        folder: 'Frontend',
        updated_at: '2026-09-19T17:01:00.000Z',
        sync_status: 'synced',
      },
    ];

    const graph = buildLocalGraph({
      notes,
      links,
    });

    // Validar presença do nó de link
    const linkNode = graph.nodes.find((n) => n.id === 'link-link-101');
    expect(linkNode).toBeDefined();
    expect(linkNode?.title).toBe('Documentação Nuxt');
    expect((linkNode as any)?.url).toBe('https://nuxt.com');
    expect(linkNode?.color).toBe('#06B6D4');

    // Validar conexão da nota de origem ao link
    const edge = graph.edges.find((e) => e.source === 'note-note-1' && e.target === 'link-link-101');
    expect(edge).toBeDefined();
    expect(edge?.type).toBe('note-link');

    // Validar conexão com pasta
    const folderEdge = graph.edges.find((e) => e.source === 'link-link-101' && e.target === 'folder-Frontend');
    expect(folderEdge).toBeDefined();

    expect(graph.counts?.links).toBe(1);
  });

  it('buildLocalGraph should connect link node to source canvas when sourceCanvasId is present', () => {
    const canvases: LocalCanvasItem[] = [
      {
        id: 'canvas-1',
        name: 'Mapa Geral',
        document: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
        updated_at: '2026-09-19T17:00:00.000Z',
        sync_status: 'synced',
      },
    ];

    const links: LocalLinkItem[] = [
      {
        id: 'link-202',
        url: 'https://developer.mozilla.org',
        title: 'MDN Web Docs',
        domain: 'developer.mozilla.org',
        sourceCanvasId: 'canvas-1',
        updated_at: '2026-09-19T17:01:00.000Z',
        sync_status: 'synced',
      },
    ];

    const graph = buildLocalGraph({
      canvases,
      links,
    });

    const edge = graph.edges.find((e) => e.source === 'canvas-canvas-1' && e.target === 'link-link-202');
    expect(edge).toBeDefined();
    expect(edge?.type).toBe('canvas-link');
  });

  it('clicking a link node triggers external URL opening in default system browser', async () => {
    const windowOpenSpy = vi.fn();
    vi.stubGlobal('window', {
      open: windowOpenSpy,
      location: { href: 'http://localhost' },
    });

    await openExternalUrl('https://github.com/torvalds/linux');
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://github.com/torvalds/linux',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
