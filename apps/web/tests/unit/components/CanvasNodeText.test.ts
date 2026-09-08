import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import CanvasNodeText from '../../../app/components/canvas/CanvasNodeText.vue';
import type { CanvasNode } from '../../../app/interfaces/canvas';

describe('CanvasNodeText Component', () => {
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
    });

    const rootDiv = wrapper.find('div');
    // Deve conter classes de painel / card
    expect(rootDiv.classes()).toContain('bg-bgPanel/95');
    expect(rootDiv.classes()).toContain('rounded-xl');
    expect(wrapper.html()).toContain('Texto do card');
    // Deve conter barra de cor de cabeçalho
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
    });

    const rootDiv = wrapper.find('div');
    // NÃO deve conter classes de card/quadrado
    expect(rootDiv.classes()).not.toContain('bg-bgPanel/95');
    expect(rootDiv.classes()).toContain('bg-transparent');
    expect(rootDiv.classes()).toContain('border-transparent');
    // NÃO deve conter a barra de cor de cabeçalho
    expect(wrapper.find('.h-1\\.5').exists()).toBe(false);
    // Deve conter o texto renderizado
    expect(wrapper.text()).toContain('Texto Livre no Canvas');
  });

  it('inicia automaticamente em modo de edição ao criar texto livre vazio', async () => {
    const node: CanvasNode = {
      id: 'node-loose-empty',
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
    });

    // Aguarda atualização reativa do nextTick do onMounted
    await wrapper.vm.$nextTick();
    await nextTick();

    // Textarea deve estar ativo e pronto para digitação imediata
    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);
    expect(textarea.attributes('placeholder')).toContain('Comece a escrever livremente...');

    // Digita texto livre
    await textarea.setValue('Minha anotação solta');
    await textarea.trigger('blur');

    // Deve emitir update:text com o conteúdo digitado
    expect(wrapper.emitted('update:text')).toBeTruthy();
    expect(wrapper.emitted('update:text')?.[0]).toEqual(['Minha anotação solta']);
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
    });

    await wrapper.vm.$nextTick();
    await nextTick();

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);

    // Usuário sai sem digitar nada (blur com string vazia)
    await textarea.setValue('   ');
    await textarea.trigger('blur');

    // Deve emitir delete para limpar o nó vazio automaticamente
    expect(wrapper.emitted('delete')).toBeTruthy();
  });

  it('renderiza cabeçalhos hierárquicos com #, ##, ### em tags estruturadas', () => {
    const node: CanvasNode = {
      id: 'node-headers',
      type: 'text',
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      text: '# Cabeçalho 1\n## Cabeçalho 2\n### Cabeçalho 3\nTexto normal **negrito** e *itálico*',
    };

    const wrapper = mount(CanvasNodeText, {
      props: {
        node,
        isSelected: false,
      },
    });

    const markdownDiv = wrapper.find('.canvas-markdown-content');
    expect(markdownDiv.exists()).toBe(true);
    expect(markdownDiv.find('h1').exists()).toBe(true);
    expect(markdownDiv.find('h1').text()).toBe('Cabeçalho 1');
    expect(markdownDiv.find('h2').exists()).toBe(true);
    expect(markdownDiv.find('h2').text()).toBe('Cabeçalho 2');
    expect(markdownDiv.find('h3').exists()).toBe(true);
    expect(markdownDiv.find('h3').text()).toBe('Cabeçalho 3');
    expect(markdownDiv.find('strong').text()).toBe('negrito');
    expect(markdownDiv.find('em').text()).toBe('itálico');
  });

  it('aplica negrito com atalho Ctrl+B e itálico com Ctrl+I ao editar', async () => {
    const node: CanvasNode = {
      id: 'node-card-edit',
      type: 'text',
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      text: 'Texto base',
    };

    const wrapper = mount(CanvasNodeText, {
      props: {
        node,
        isSelected: false,
      },
    });

    // Inicia edição via dblclick no body
    const body = wrapper.find('.flex-1.p-3\\.5');
    await body.trigger('dblclick');
    await nextTick();

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);

    const textareaEl = textarea.element as HTMLTextAreaElement;
    // Simula seleção da palavra "base" (índices 6 a 10)
    textareaEl.selectionStart = 6;
    textareaEl.selectionEnd = 10;

    // Dispara Ctrl+B
    await textarea.trigger('keydown', {
      key: 'b',
      ctrlKey: true,
    });
    await nextTick();

    expect(textareaEl.value).toBe('Texto **base**');

    // Dispara Ctrl+B novamente para desfazer (toggle)
    await textarea.trigger('keydown', {
      key: 'b',
      ctrlKey: true,
    });
    await nextTick();

    expect(textareaEl.value).toBe('Texto base');

    // Dispara Ctrl+I para itálico
    textareaEl.selectionStart = 6;
    textareaEl.selectionEnd = 10;
    await textarea.trigger('keydown', {
      key: 'i',
      ctrlKey: true,
    });
    await nextTick();

    expect(textareaEl.value).toBe('Texto *base*');
  });

  it('edita nota do card em modo limpo sem barra inferior e finaliza com Ctrl+Enter', async () => {
    const node: CanvasNode = {
      id: 'node-clean-editor',
      type: 'text',
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      text: 'Texto do card',
    };

    const wrapper = mount(CanvasNodeText, {
      props: {
        node,
        isSelected: false,
      },
    });

    const body = wrapper.find('.flex-1.p-3\\.5');
    await body.trigger('dblclick');
    await nextTick();

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);

    // Não deve conter a barra inferior com Markdown suportado ou botão Pronto
    expect(wrapper.text()).not.toContain('Markdown suportado');
    expect(wrapper.find('button').exists()).toBe(false);

    // Altera o texto e pressiona Ctrl+Enter para finalizar
    await textarea.setValue('Texto atualizado');
    await textarea.trigger('keydown', {
      key: 'Enter',
      ctrlKey: true,
    });
    await nextTick();

    expect(wrapper.emitted('update:text')).toBeTruthy();
    expect(wrapper.emitted('update:text')?.[0]).toEqual(['Texto atualizado']);
  });
});

