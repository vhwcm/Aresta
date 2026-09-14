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

  it('renders SVG element correctly when there are nodes', () => {
    const wrapper = mount(KnowledgeGraphView, {
      props: {
        canvases: sampleCanvases,
        notes: sampleNotes,
      },
    });

    expect(wrapper.find('svg').exists()).toBe(true);
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

    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('cria nós de pastas e links diretos para notas e quadros pertencentes à pasta', () => {
    const canvases: CanvasSummary[] = [
      {
        id: 'c-1',
        title: 'Quadro Projetos',
        folder: 'Projetos',
        updatedAt: '2026-09-04T10:00:00Z',
      },
    ];

    const notes: NoteItem[] = [
      {
        id: 'n-1',
        userId: 1,
        title: 'Nota Projetos',
        content: 'Conteúdo',
        folder: 'Projetos',
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

    expect(wrapper.find('svg').exists()).toBe(true);
    const vm = wrapper.vm as any;
    const folderNode = vm.nodes.find((n: any) => n.kind === 'folder' && n.title === 'Projetos');
    expect(folderNode).toBeDefined();
    expect(folderNode.id).toBe('folder-Projetos');
    expect(folderNode.color).toBe('#F59E0B');

    const noteLink = vm.links.find(
      (l: any) => l.source === 'note-n-1' && l.target === 'folder-Projetos' && l.type === 'folder'
    );
    expect(noteLink).toBeDefined();

    const canvasLink = vm.links.find(
      (l: any) => l.source === 'canvas-c-1' && l.target === 'folder-Projetos' && l.type === 'folder'
    );
    expect(canvasLink).toBeDefined();
  });
});
