import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MilkdownEditor from '~/components/MilkdownEditor.vue';

describe('MilkdownEditor Component', () => {
  it('renders editor container with custom wrapper and placeholder', () => {
    const wrapper = mount(MilkdownEditor, {
      props: {
        modelValue: '# Test Title',
        placeholder: 'Digite algo...',
      },
    });

    expect(wrapper.find('.milkdown-aresta-wrapper').exists()).toBe(true);
    expect(wrapper.find('.milkdown').exists()).toBe(true);
  });

  it('exposes focus, getContent, insertText and insertImage methods', () => {
    const wrapper = mount(MilkdownEditor, {
      props: {
        modelValue: 'Initial text',
      },
    });

    expect(typeof wrapper.vm.focus).toBe('function');
    expect(typeof wrapper.vm.getContent).toBe('function');
    expect(typeof wrapper.vm.insertText).toBe('function');
    expect(typeof wrapper.vm.insertImage).toBe('function');
    expect(wrapper.vm.getContent()).toBe('Initial text');
  });

  it('guarantees heading and typographic styling rules exist in milkdown theme', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cssPath = path.resolve(__dirname, '../../../app/assets/css/milkdown-aresta-theme.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    expect(cssContent).toContain('.milkdown-aresta-wrapper h1');
    expect(cssContent).toContain('.milkdown-aresta-wrapper h2');
    expect(cssContent).toContain('.milkdown-aresta-wrapper h3');
    expect(cssContent).toContain('font-weight: 700');
    // Regras de imagem
    expect(cssContent).toContain('.milkdown-aresta-wrapper .milkdown .editor img');
    expect(cssContent).toContain('max-width: 100%');
  });

  it('stops propagation when image file is dropped in editor to avoid parent duplicate handling', async () => {
    const wrapper = mount(MilkdownEditor, {
      props: { modelValue: 'Texto' },
    });

    const file = new File(['dummy content'], 'photo.png', { type: 'image/png' });
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        files: [file],
        getData: vi.fn(),
      },
    });

    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    const container = wrapper.find('.milkdown-aresta-wrapper');
    container.element.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('handles web image drop with image URL and stops propagation', async () => {
    const wrapper = mount(MilkdownEditor, {
      props: { modelValue: 'Texto' },
    });

    const insertImageSpy = vi.spyOn(wrapper.vm, 'insertImage');
    const event = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'dataTransfer', {
      value: {
        files: [],
        getData: (type: string) => {
          if (type === 'text/uri-list') return 'https://example.com/web-pic.png';
          return '';
        },
      },
    });

    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    const container = wrapper.find('.milkdown-aresta-wrapper');
    container.element.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();

    // Testa método exposto insertImage diretamente
    expect(() => wrapper.vm.insertImage('https://example.com/web-pic.png', 'Imagem')).not.toThrow();
  });
});
