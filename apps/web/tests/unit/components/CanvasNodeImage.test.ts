import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasNodeImage from '../../../app/components/canvas/CanvasNodeImage.vue';
import type { CanvasNode } from '../../../app/interfaces/canvas';

describe('CanvasNodeImage Component', () => {
  const sampleNode: CanvasNode = {
    id: 'node-image-1',
    type: 'image',
    x: 100,
    y: 100,
    width: 320,
    height: 240,
    imageUrl: 'https://example.com/photo.png',
    imageAlt: 'Foto de Exemplo',
    color: '#E57B55',
  };

  it('renders image node container with image element and alt caption', () => {
    const wrapper = mount(CanvasNodeImage, {
      props: {
        node: sampleNode,
        isSelected: false,
      },
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/photo.png');
    expect(img.attributes('alt')).toBe('Foto de Exemplo');
    expect(wrapper.text()).toContain('Foto de Exemplo');
  });

  it('applies selection styling when isSelected is true', () => {
    const wrapper = mount(CanvasNodeImage, {
      props: {
        node: sampleNode,
        isSelected: true,
      },
    });

    expect(wrapper.classes()).toContain('border-primary');
    expect(wrapper.classes()).toContain('ring-2');
  });

  it('renders top color bar when node.color is defined', () => {
    const wrapper = mount(CanvasNodeImage, {
      props: {
        node: sampleNode,
      },
    });

    const colorBar = wrapper.find('.h-1\\.5');
    expect(colorBar.exists()).toBe(true);
    expect((colorBar.element as HTMLElement).style.backgroundColor).toMatch(/#E57B55|rgb\(229,\s*123,\s*85\)/i);
  });

  it('handles image error gracefully with fallback card and retry option', async () => {
    const wrapper = mount(CanvasNodeImage, {
      props: {
        node: sampleNode,
      },
    });

    const img = wrapper.find('img');
    await img.trigger('error');

    expect(wrapper.text()).toContain('Imagem indisponível');
    expect(wrapper.text()).toContain('Tentar novamente');

    const retryBtn = wrapper.find('button');
    await retryBtn.trigger('click');
    expect(wrapper.text()).toContain('Carregando...');
  });

  it('opens and closes lightbox modal on double click and close button', async () => {
    const wrapper = mount(CanvasNodeImage, {
      props: {
        node: sampleNode,
      },
      attachTo: document.body,
    });

    // Inicialmente lightbox fechado
    expect(document.querySelector('.fixed.inset-0.z-50')).toBeNull();

    // Duplo clique no nó
    await wrapper.trigger('dblclick');

    // Lightbox aberto no body
    const modal = document.querySelector('.fixed.inset-0.z-50');
    expect(modal).not.toBeNull();
    expect(modal?.querySelector('img')?.getAttribute('src')).toBe('https://example.com/photo.png');

    // Fechar lightbox via botão
    const closeBtn = modal?.querySelector('button[title*="Fechar"]');
    closeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Fecha
    await wrapper.vm.$nextTick();
    expect(document.querySelector('.fixed.inset-0.z-50')).toBeNull();

    wrapper.unmount();
  });
});
