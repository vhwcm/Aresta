import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasNodeText from '../../../app/components/canvas/CanvasNodeText.vue';
import type { CanvasNode } from '../../../app/interfaces/canvas';

describe('CanvasNodeText Component', () => {
  const milkdownStub = {
    props: ['modelValue', 'placeholder'],
    emits: ['update:modelValue', 'blur'],
    template: '<div class="milkdown-stub" :data-placeholder="placeholder">{{ modelValue }}</div>'
  };

  it('renderiza nota em modo card (type === text) com borda e painel', () => {
    const node: CanvasNode = {
      id: 'node-1',
      type: 'text',
      x: 10,
      y: 10,
      width: 240,
      height: 150,
      text: 'Texto do card',
      color: '#E57B55',
    };

    const wrapper = mount(CanvasNodeText, {
      props: {
        node,
        isSelected: false,
      },
      global: {
        stubs: {
          MilkdownEditor: milkdownStub,
        },
      },
    });

    const rootDiv = wrapper.find('div');
    expect(rootDiv.classes()).toContain('bg-bgPanel/95');
    expect(rootDiv.classes()).toContain('rounded-xl');
    expect(wrapper.html()).toContain('Texto do card');
    expect(wrapper.find('.h-1\\.5').exists()).toBe(true);
  });

  it('renderiza texto livre (type === loose_text) sem quadrado, sem painel e sem bordas', () => {
    const node: CanvasNode = {
      id: 'node-loose-1',
      type: 'loose_text',
      x: 50,
      y: 50,
      width: 280,
      height: 60,
      text: 'Texto Livre no Canvas',
      color: '#3B82F6',
    };

    const wrapper = mount(CanvasNodeText, {
      props: {
        node,
        isSelected: false,
      },
      global: {
        stubs: {
          MilkdownEditor: milkdownStub,
        },
      },
    });

    const rootDiv = wrapper.find('div');
    expect(rootDiv.classes()).not.toContain('bg-bgPanel/95');
    expect(rootDiv.classes()).toContain('bg-transparent');
    expect(wrapper.find('.h-1\\.5').exists()).toBe(false);
    expect(wrapper.text()).toContain('Texto Livre no Canvas');
  });

  it('emite update:text quando o editor altera o conteúdo', async () => {
    const node: CanvasNode = {
      id: 'node-edit',
      type: 'text',
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      text: 'Original',
    };

    const wrapper = mount(CanvasNodeText, {
      props: {
        node,
        isSelected: true,
      },
      global: {
        stubs: {
          MilkdownEditor: {
            props: ['modelValue'],
            emits: ['update:modelValue'],
            template: '<div class="milkdown-stub" @click="$emit(\'update:modelValue\', \'Texto Atualizado\')">Stub</div>'
          },
        },
      },
    });

    const stub = wrapper.find('.milkdown-stub');
    await stub.trigger('click');

    expect(wrapper.emitted('update:text')).toBeTruthy();
    expect(wrapper.emitted('update:text')?.[0]).toEqual(['Texto Atualizado']);
  });

  it('emite evento delete ao sair da edição de texto livre sem ter digitado nada', async () => {
    const node: CanvasNode = {
      id: 'node-loose-discard',
      type: 'loose_text',
      x: 100,
      y: 100,
      width: 280,
      height: 56,
      text: '',
    };

    const wrapper = mount(CanvasNodeText, {
      props: {
        node,
        isSelected: true,
      },
      global: {
        stubs: {
          MilkdownEditor: {
            props: ['modelValue'],
            emits: ['blur'],
            template: '<div class="milkdown-stub" @click="$emit(\'blur\')">Stub</div>'
          },
        },
      },
    });

    const stub = wrapper.find('.milkdown-stub');
    await stub.trigger('click');

    expect(wrapper.emitted('delete')).toBeTruthy();
  });
});
