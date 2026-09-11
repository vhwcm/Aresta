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

  it('exposes focus and getContent methods', () => {
    const wrapper = mount(MilkdownEditor, {
      props: {
        modelValue: 'Initial text',
      },
    });

    expect(typeof wrapper.vm.focus).toBe('function');
    expect(typeof wrapper.vm.getContent).toBe('function');
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
  });
});
