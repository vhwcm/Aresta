import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import KnowledgeGraphView from '~/components/canvas/KnowledgeGraphView.vue';
import type { CanvasSummary } from '~/interfaces/canvas';
import type { NoteItem } from '~/interfaces/note';

describe('KnowledgeGraphView Component', () => {
  const sampleCanvases: CanvasSummary[] = [
    {
      id: 'c1',
      title: 'Quadro Alfa',
      description: 'Descrição do quadro',
      folder: 'Projetos',
      tags: ['aresta'],
      nodeCount: 4,
      edgeCount: 3,
      updatedAt: '2026-09-04T10:00:00Z',
    },
  ];

  const sampleNotes: NoteItem[] = [
    {
      id: 'n1',
      userId: 1,
      title: 'Nota Beta',
      content: '# Nota\n![[canvas:c1]]\nConteúdo com link',
      folder: 'Projetos',
      tags: ['aresta'],
      updatedAt: '2026-09-04T11:00:00Z',
    },
  ];

  it('renders SVG element and legend counters correctly', () => {
    const wrapper = mount(KnowledgeGraphView, {
      props: {
        canvases: sampleCanvases,
        notes: sampleNotes,
      },
    });

    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.text()).toContain('Quadros (1)');
    expect(wrapper.text()).toContain('Notas (1)');
  });

  it('renders empty state when there are no nodes', () => {
    const wrapper = mount(KnowledgeGraphView, {
      props: {
        canvases: [],
        notes: [],
      },
    });

    expect(wrapper.text()).toContain('Grafo de Conhecimento Vazio');
  });

  it('conecta quadro e nota quando o quadro contém a nota em noteIds', () => {
    const canvases: CanvasSummary[] = [
      {
        id: 'c-quadro',
        title: 'Quadro de Teste',
        noteIds: ['n-nota-criada'],
        updatedAt: '2026-09-04T10:00:00Z',
      },
    ];

    const notes: NoteItem[] = [
      {
        id: 'n-nota-criada',
        userId: 1,
        title: 'Nota Criada no Canvas',
        content: 'Conteúdo sem markdown explícito',
        tags: [],
        updatedAt: '2026-09-04T10:00:00Z',
      },
    ];

    const wrapper = mount(KnowledgeGraphView, {
      props: {
        canvases,
        notes,
      },
    });

    expect(wrapper.text()).toContain('Quadros (1)');
    expect(wrapper.text()).toContain('Notas (1)');
    // Deve haver 1 conexão detectada
    expect(wrapper.text()).toContain('1 conexões');
  });
});
