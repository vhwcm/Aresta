import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FolderTagSidebar from '../../../app/components/FolderTagSidebar.vue';

describe('FolderTagSidebar component (Unificação de Tags e Pastas)', () => {
  const items = [
    { id: '1', title: 'Nota Dupla', tags: ['filosofia', 'livros'] },
    { id: '2', title: 'Nota Só Filo', tags: ['filosofia'] },
    { id: '3', title: 'Nota Sem Pasta', tags: [] },
  ];
  const folders = ['Estudos', 'Projetos'];

  it('renderiza botão de alternância de tema e itens sem pasta', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        itemLabel: 'quadros',
      },
    });

    expect(wrapper.find('button[aria-label="Alternar tema da interface"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Sem pasta');
    expect(wrapper.text()).toContain('Estudos');
    expect(wrapper.text()).toContain('Projetos');
  });

  it('emite select-folder ao clicar em uma pasta/tag', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
      },
    });

    const folderButton = wrapper.findAll('.cursor-pointer').find((el) => el.text().includes('Estudos'));
    expect(folderButton).toBeDefined();
    await folderButton?.trigger('click');

    expect(wrapper.emitted('select-folder')).toBeTruthy();
    expect(wrapper.emitted('select-folder')?.[0]).toEqual(['Estudos']);
  });

  it('multi-referência: item com múltiplas tags aparece nas pastas de cada uma', async () => {
    const multiItems = [
      { id: 'note-multi', title: 'Conhecimento Compartilhado', kind: 'note' as const, tags: ['filosofia', 'livros'] },
    ];

    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: multiItems,
        folders: ['filosofia', 'livros'],
      },
    });

    // Ambas as pastas devem estar listadas
    expect(wrapper.text()).toContain('filosofia');
    expect(wrapper.text()).toContain('livros');

    // Expande a pasta filosofia
    const expandButtons = wrapper.findAll('button[title="Expandir ou recolher pasta"]');
    for (const btn of expandButtons) {
      await btn.trigger('click');
    }

    // O mesmo item deve ser renderizado em ambas as pastas!
    const matches = wrapper.findAll('.group\\/file').filter((el) => el.text().includes('Conhecimento Compartilhado'));
    expect(matches.length).toBe(2);
  });

  it('exibe indicador de link/referência em arquivos que pertencem a múltiplas tags', async () => {
    const multiItems = [
      { id: 'note-multi', title: 'Nota com 2 tags', kind: 'note' as const, tags: ['tagA', 'tagB'] },
      { id: 'note-single', title: 'Nota com 1 tag', kind: 'note' as const, tags: ['tagA'] },
    ];

    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: multiItems,
        folders: ['tagA', 'tagB'],
      },
    });

    // Expande as pastas
    const expandButtons = wrapper.findAll('button[title="Expandir ou recolher pasta"]');
    for (const btn of expandButtons) {
      await btn.trigger('click');
    }

    // Deve exibir o indicador com title contendo as pastas
    const linkIcon = wrapper.find('[title*="Presente em 2 pastas"]');
    expect(linkIcon.exists()).toBe(true);
  });

  it('alterna colapso ao clicar no botão de sidebar e emite update:collapsed', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        collapsed: false,
      },
    });

    const toggleBtn = wrapper.find('button[title="Recolher painel"]');
    expect(toggleBtn.exists()).toBe(true);
    await toggleBtn.trigger('click');

    expect(wrapper.emitted('update:collapsed')).toBeTruthy();
    expect(wrapper.emitted('update:collapsed')?.[0]).toEqual([true]);
  });

  it('inicia colapsado quando collapsed prop for true', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        collapsed: true,
      },
    });

    const expandBtn = wrapper.find('button[title="Expandir painel"]');
    expect(expandBtn.exists()).toBe(true);
    expect(wrapper.find('aside').classes()).toContain('w-16');
  });

  it('expande pasta e emite select-item ao clicar em arquivo aninhado', async () => {
    const treeItems = [
      { id: 'canvas-1', title: 'Quadro Aninhado', kind: 'canvas' as const, tags: ['Estudos'] },
      { id: 'note-1', title: 'Nota Aninhada', kind: 'note' as const, tags: ['Estudos'] },
    ];

    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: treeItems,
        folders: ['Estudos'],
      },
    });

    const expandChevron = wrapper.find('button[title="Expandir ou recolher pasta"]');
    expect(expandChevron.exists()).toBe(true);
    await expandChevron.trigger('click');

    expect(wrapper.text()).toContain('Quadro Aninhado');
    expect(wrapper.text()).toContain('Nota Aninhada');

    const fileItem = wrapper.findAll('.cursor-pointer').find((el) => el.text().includes('Quadro Aninhado'));
    expect(fileItem).toBeDefined();
    await fileItem?.trigger('click');

    expect(wrapper.emitted('select-item')).toBeTruthy();
    expect(wrapper.emitted('select-item')?.[0]?.[0]).toMatchObject({ id: 'canvas-1', kind: 'canvas' });
  });

  it('emite create-note ao clicar no botão de nova anotação', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [],
        folders: ['Estudos'],
      },
    });

    const addBtn = wrapper.find('button[title="Criar novo item"]');
    expect(addBtn.exists()).toBe(true);
    await addBtn.trigger('click');

    const noteOptionBtn = wrapper.findAll('button').find((el) => el.text().includes('Nova Nota'));
    expect(noteOptionBtn).toBeDefined();
    await noteOptionBtn?.trigger('click');

    expect(wrapper.emitted('create-note')).toBeTruthy();
  });

  it('abre o menu dropdown ao clicar em Adicionar e emite os eventos respectivos', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [],
        folders: ['Estudos'],
      },
    });

    const addBtn = wrapper.find('button[title="Criar novo item"]');
    expect(addBtn.exists()).toBe(true);
    await addBtn.trigger('click');

    expect(wrapper.text()).toContain('Nova Nota');
    expect(wrapper.text()).toContain('Novo Desenho');
    expect(wrapper.text()).toContain('Novo Link');
    expect(wrapper.text()).toContain('Novo Quadro');
    expect(wrapper.text()).toContain('Nova Pasta');

    const drawingBtn = wrapper.findAll('button').find((el) => el.text().includes('Novo Desenho'));
    expect(drawingBtn).toBeDefined();
    await drawingBtn?.trigger('click');

    expect(wrapper.emitted('create-drawing')).toBeTruthy();
  });

  it('emite create-canvas ao clicar na opção Novo Quadro no menu dropdown', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [],
        folders: ['Estudos'],
      },
    });

    const addBtn = wrapper.find('button[title="Criar novo item"]');
    expect(addBtn.exists()).toBe(true);
    await addBtn.trigger('click');

    const canvasBtn = wrapper.findAll('button').find((el) => el.text().includes('Novo Quadro'));
    expect(canvasBtn).toBeDefined();
    await canvasBtn?.trigger('click');

    expect(wrapper.emitted('create-canvas')).toBeTruthy();
  });

  it('renderiza os ícones de navegação principal incluindo botão de adicionar geral ao lado da conta', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [],
        folders: [],
        collapsed: false,
      },
    });

    expect(wrapper.find('[title="Início"]').exists()).toBe(true);
    expect(wrapper.find('[title="Meus Livros"]').exists()).toBe(true);
    expect(wrapper.find('[title="Revisão (Flashcards & Resumos)"]').exists()).toBe(true);
    expect(wrapper.find('[title="Minha Conta"]').exists()).toBe(true);
    expect(wrapper.find('[title="Criar novo item"]').exists()).toBe(true);
  });

  it('renderiza lupa de busca de nós ao lado de Grafo/Grade e abre input de busca', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [],
        folders: [],
        collapsed: false,
        viewLayout: 'graph',
      },
    });

    const searchBtn = wrapper.find('button[title="Pesquisar nós do grafo"]');
    expect(searchBtn.exists()).toBe(true);

    await searchBtn.trigger('click');
    const searchInput = wrapper.find('input[placeholder*="Pesquisar nós do grafo"]');
    expect(searchInput.exists()).toBe(true);
  });

  it('a árvore de arquivos não exibe título redundante de cabeçalho', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [{ id: '1', tags: ['filosofia'] }],
        folders: ['filosofia'],
        collapsed: false,
      },
    });

    expect(wrapper.text()).not.toContain('PASTAS');
    expect(wrapper.text()).not.toContain('ARQUIVOS');
  });

  it('renderiza o botao azul de tags no modo colapsado e abre o modal ao clicar', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [],
        folders: [],
        collapsed: true,
      },
    });

    const collapsedBtn = wrapper.find('[data-testid="manage-tags-collapsed-btn"]');
    expect(collapsedBtn.exists()).toBe(true);
    expect(collapsedBtn.classes().some((c) => c.includes('blue'))).toBe(true);

    await collapsedBtn.trigger('click');
    expect(wrapper.findComponent({ name: 'ManageThemesModal' }).props('isOpen')).toBe(true);
  });

  it('renderiza o indicador de ofensiva ao lado da lupa no cabecalho', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [],
        folders: [],
        collapsed: false,
      },
    });

    const streakBtn = wrapper.find('[data-testid="reading-streak-trigger-btn"]');
    expect(streakBtn.exists()).toBe(true);
    expect(streakBtn.attributes('title')).toBe('Ofensiva de Leitura');
  });
});
