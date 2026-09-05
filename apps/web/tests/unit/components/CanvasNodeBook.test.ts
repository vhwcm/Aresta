import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasNodeBook from '../../../app/components/canvas/CanvasNodeBook.vue';
import type { CanvasNode } from '../../../app/interfaces/canvas';

describe('CanvasNodeBook Component', () => {
  it('renderiza card de livro com capa, título, autor e progresso', () => {
    const node: CanvasNode = {
      id: 'node-book-1',
      type: 'book',
      x: 20,
      y: 20,
      width: 280,
      height: 140,
      bookId: 42,
      bookTitle: 'O Programador Pragmático',
      bookAuthor: 'Andy Hunt & Dave Thomas',
      bookCover: 'covers/pragmatic.jpg',
      bookProgress: 65,
      color: '#3B82F6',
    };

    const wrapper = mount(CanvasNodeBook, {
      props: {
        node,
        isSelected: false,
      },
    });

    // Título e Autor
    expect(wrapper.text()).toContain('O Programador Pragmático');
    expect(wrapper.text()).toContain('Andy Hunt & Dave Thomas');
    expect(wrapper.text()).toContain('65%');

    // Capa do livro
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('http://localhost:3003/covers/pragmatic.jpg');

    // Link de redirecionamento para o leitor
    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('http://localhost:3010/reader?bookId=42');
    expect(link.attributes('target')).toBe('_blank');
  });

  it('exibe placeholder gracioso quando livro não possui capa', () => {
    const node: CanvasNode = {
      id: 'node-book-2',
      type: 'book',
      x: 0,
      y: 0,
      width: 280,
      height: 140,
      bookId: 99,
      bookTitle: 'Livro Sem Capa',
    };

    const wrapper = mount(CanvasNodeBook, {
      props: {
        node,
      },
    });

    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).toContain('Sem capa');
    expect(wrapper.find('a').attributes('href')).toBe('http://localhost:3010/reader?bookId=99');
  });
});
