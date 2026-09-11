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
});
