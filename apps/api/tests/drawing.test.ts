import { describe, it, expect } from 'vitest';
import { drawingService } from '../src/modules/canvas/services/drawing.service';
import { prisma } from '../src/modules/canvas/config/database';

describe('DrawingService in aresta-canvas', () => {
  it('cria, recupera e lista notas de desenho com páginas estruturadas', async () => {
    const created = await drawingService.create(1, {
      title: 'Caderno de Desenho 1',
      folder: 'Estudos',
      tags: ['diagrama', 'samsung-notes'],
    });

    expect(created).toHaveProperty('id');
    expect(created.title).toBe('Caderno de Desenho 1');
    expect(created.folder).toBe('Estudos');

    const fetched = await drawingService.getById(created.id, 1);
    expect(fetched.title).toBe('Caderno de Desenho 1');
    expect(fetched.pages).toHaveLength(1);
    expect(fetched.pages[0].backgroundType).toBe('ruled');
    expect(fetched.tags).toEqual(['diagrama', 'samsung-notes']);

    // Listagem
    const list = await drawingService.getAllByUser(1, { folder: 'Estudos' });
    expect(list.drawings.length).toBeGreaterThanOrEqual(1);
    const found = list.drawings.find((d) => d.id === created.id);
    expect(found).toBeDefined();
    expect(found?.pagesCount).toBe(1);

    // Limpeza
    await drawingService.delete(created.id, 1);
  });

  it('atualiza páginas, traços e preview de nota de desenho', async () => {
    const created = await drawingService.create(1, {
      title: 'Nota Para Atualizar',
    });

    const updatedPages = [
      {
        id: 'p-1',
        pageNumber: 1,
        width: 794,
        height: 1123,
        backgroundType: 'grid',
        strokes: [
          {
            id: 's-1',
            tool: 'pen',
            color: '#000000',
            size: 3,
            opacity: 1,
            points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
          },
        ],
      },
      {
        id: 'p-2',
        pageNumber: 2,
        width: 794,
        height: 1123,
        backgroundType: 'blank',
        strokes: [],
      },
    ];

    const updated = await drawingService.update(created.id, 1, {
      title: 'Nota Atualizada',
      pages_data: JSON.stringify(updatedPages),
      preview_url: 'data:image/png;base64,samplePreview',
    });

    expect(updated.title).toBe('Nota Atualizada');
    expect(updated.preview_url).toBe('data:image/png;base64,samplePreview');

    const fetched = await drawingService.getById(created.id, 1);
    expect(fetched.pages).toHaveLength(2);
    expect(fetched.pages[0].strokes).toHaveLength(1);

    await drawingService.delete(created.id, 1);
  });

  it('converte desenho em nota tradicional e opcionalmente remove o original', async () => {
    const created = await drawingService.create(1, {
      title: 'Desenho a Converter',
      folder: 'Ideias',
    });

    const conversion = await drawingService.convertToNote(created.id, 1, {
      title: 'Nota Gerada pela IA',
      htmlContent: '<div class="aresta-drawing-synthesis"><h1>Título IA</h1><p>Conteúdo</p></div>',
      deleteOriginal: true,
      folder: 'Ideias',
    });

    expect(conversion.note).toHaveProperty('id');
    expect(conversion.note.title).toBe('Nota Gerada pela IA');
    expect(conversion.note.content).toContain('Título IA');
    expect(conversion.originalDeleted).toBe(true);

    // Verifica se o desenho original foi excluído
    await expect(drawingService.getById(created.id, 1)).rejects.toThrow();

    // Limpa a nota criada
    await prisma.note.delete({ where: { id: conversion.note.id } });
  });
});
