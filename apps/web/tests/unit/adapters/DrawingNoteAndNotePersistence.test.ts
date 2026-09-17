import { describe, it, expect, beforeEach } from 'vitest';
import { reactive, ref } from 'vue';
import { drawingNoteRepo } from '../../../app/adapters/database/repositories/DrawingNoteRepository';
import { noteRepo } from '../../../app/adapters/database/repositories/NoteRepository';
import { useDrawing } from '../../../app/composables/useDrawing';
import { useNotes } from '../../../app/composables/useNotes';

describe('Drawing and Note Persistence (Vue Reactivity & Cloneability)', () => {
  beforeEach(() => {
    const drawing = useDrawing();
    drawing.resetDrawingState();
  });

  it('salva e recupera drawing_note contendo proxies reativos do Vue sem erro', async () => {
    const reactiveTags = reactive(['tag-a', 'tag-b']);
    const reactivePages = reactive([
      {
        id: 'p1',
        pageNumber: 1,
        width: 794,
        height: 1123,
        backgroundType: 'blank',
        strokes: [
          {
            id: 's1',
            tool: 'pen',
            color: '#E57B55',
            size: 3,
            opacity: 1,
            points: reactive([{ x: 10, y: 10 }, { x: 20, y: 20 }]),
          },
        ],
      },
    ]);

    const saved = await drawingNoteRepo.save({
      id: 'drawing-reactive-1',
      title: 'Desenho com Proxy',
      tags: reactiveTags as any,
      pages_data: JSON.stringify(reactivePages),
    });

    expect(saved.id).toBe('drawing-reactive-1');
    expect(saved.tags).toEqual(['tag-a', 'tag-b']);

    const retrieved = await drawingNoteRepo.getById('drawing-reactive-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Desenho com Proxy');

    const parsedPages = JSON.parse(retrieved!.pages_data as string);
    expect(parsedPages).toHaveLength(1);
    expect(parsedPages[0].strokes).toHaveLength(1);
    expect(parsedPages[0].strokes[0].points).toHaveLength(2);
  });

  it('salva e recupera note contendo proxies reativos do Vue sem erro', async () => {
    const reactiveTags = reactive(['ideia', 'estudo']);
    const reactiveLinks = reactive([{ targetType: 'NOTE' as const, targetId: 'note-xyz' }]);

    const saved = await noteRepo.save({
      id: 'note-reactive-1',
      title: 'Nota com Proxy',
      content: '# Conteúdo Reativo',
      tags: reactiveTags as any,
      links: reactiveLinks as any,
    });

    expect(saved.id).toBe('note-reactive-1');
    expect(saved.tags).toEqual(['ideia', 'estudo']);

    const retrieved = await noteRepo.getById('note-reactive-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Nota com Proxy');
    expect(retrieved?.content).toBe('# Conteúdo Reativo');
  });

  it('useDrawing: fluxo completo de criar, desenhar, salvar e recarregar desenho', async () => {
    const { createDrawing, loadDrawing, addStrokeToActivePage, saveDrawingNow, currentDrawing } = useDrawing();

    const created = await createDrawing({
      title: 'Caderno de Teste',
      tags: ['desenho-1'],
    });

    expect(created.id).toBeDefined();

    // Adiciona traço à página
    addStrokeToActivePage({
      id: 'stroke-test',
      tool: 'pen',
      color: '#18181B',
      size: 4,
      opacity: 1,
      points: [{ x: 50, y: 50 }, { x: 80, y: 90 }],
    });

    expect(currentDrawing.value?.pages[0]?.strokes).toHaveLength(1);

    // Salva explicitamente
    await saveDrawingNow();

    // Limpa estado em memória e recarrega do repositório
    const reloaded = await loadDrawing(created.id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.id).toBe(created.id);
    expect(reloaded?.pages).toHaveLength(1);
    expect(reloaded?.pages[0]?.strokes).toHaveLength(1);
    expect(reloaded?.pages[0]?.strokes[0]?.id).toBe('stroke-test');
    expect(reloaded?.pages[0]?.strokes[0]?.points).toEqual([{ x: 50, y: 50 }, { x: 80, y: 90 }]);
  });
});
