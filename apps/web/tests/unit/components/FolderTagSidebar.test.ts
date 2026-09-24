import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FolderTagSidebar from '../../../app/components/FolderTagSidebar.vue';

describe('FolderTagSidebar component', () => {
  const items = [
    { id: '1', folder: 'Estudos', tags: ['filosofia', 'livros'] },
    { id: '2', folder: 'Estudos', tags: ['filosofia'] },
    { id: '3', folder: null, tags: ['ideias'] },
  ];
  const folders = ['Estudos', 'Projetos'];

  it('renderiza seletor de grafo/grade e itens sem pasta', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        itemLabel: 'quadros',
      },
    });

    expect(wrapper.text()).toContain('Grafo');
    expect(wrapper.text()).toContain('Grade');
    expect(wrapper.text()).toContain('Sem pasta');
    expect(wrapper.text()).toContain('Estudos');
    expect(wrapper.text()).toContain('Projetos');
  });

  it('emite select-folder ao clicar em uma pasta', async () => {
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

  it('calcula tags e emite select-tag ao clicar na tag', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
      },
    });

    expect(wrapper.text()).toContain('#filosofia');
    const tagButton = wrapper.findAll('button').find((el) => el.text().includes('#filosofia'));
    expect(tagButton).toBeDefined();

    await tagButton?.trigger('click');
    expect(wrapper.emitted('select-tag')).toBeTruthy();
    expect(wrapper.emitted('select-tag')?.[0]).toEqual(['filosofia']);
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
      { id: 'canvas-1', title: 'Quadro Aninhado', kind: 'canvas' as const, folder: 'Estudos' },
      { id: 'note-1', title: 'Nota Aninhada', kind: 'note' as const, folder: 'Estudos' },
    ];

    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: treeItems,
        folders: ['Estudos'],
      },
    });

    // Clica no botão de expandir a pasta Estudos
    const expandChevron = wrapper.find('button[title="Expandir ou recolher pasta"]');
    expect(expandChevron.exists()).toBe(true);
    await expandChevron.trigger('click');

    // Agora os arquivos aninhados aparecem
    expect(wrapper.text()).toContain('Quadro Aninhado');
    expect(wrapper.text()).toContain('Nota Aninhada');

    // Clica no arquivo Quadro Aninhado
    const fileItem = wrapper.findAll('.cursor-pointer').find((el) => el.text().includes('Quadro Aninhado'));
    expect(fileItem).toBeDefined();
    await fileItem?.trigger('click');

    expect(wrapper.emitted('select-item')).toBeTruthy();
    expect(wrapper.emitted('select-item')?.[0]?.[0]).toMatchObject({ id: 'canvas-1', kind: 'canvas' });
  });

  it('filtra itens da árvore quando selectedTag estiver ativo', async () => {
    const treeItems = [
      { id: 'canvas-1', title: 'Quadro Filosofia', kind: 'canvas' as const, folder: 'Estudos', tags: ['filo'] },
      { id: 'note-1', title: 'Nota Outra', kind: 'note' as const, folder: 'Estudos', tags: ['outra'] },
      { id: 'note-2', title: 'Nota Raiz Filo', kind: 'note' as const, folder: null, tags: ['filo'] },
    ];

    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: treeItems,
        folders: ['Estudos'],
        selectedTag: 'filo',
      },
    });

    expect(wrapper.text()).toContain('Quadro Filosofia');
    expect(wrapper.text()).toContain('Nota Raiz Filo');
    expect(wrapper.text()).not.toContain('Nota Outra');
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

    // Opções do menu dropdown
    expect(wrapper.text()).toContain('Nova Nota');
    expect(wrapper.text()).toContain('Novo Desenho');
    expect(wrapper.text()).toContain('Novo Link');
    expect(wrapper.text()).toContain('Novo Quadro');
    expect(wrapper.text()).toContain('Nova Pasta');

    // Clica em Novo Desenho
    const drawingBtn = wrapper.findAll('button').find((el) => el.text().includes('Novo Desenho'));
    expect(drawingBtn).toBeDefined();
    await drawingBtn?.trigger('click');

    expect(wrapper.emitted('create-drawing')).toBeTruthy();
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

  it('posiciona a seção de tags antes da árvore de pastas e arquivos', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [
          { id: '1', folder: 'Estudos', tags: ['filosofia'] },
        ],
        folders: ['Estudos'],
        collapsed: false,
      },
    });

    const html = wrapper.html();
    const tagsIndex = html.indexOf('Tags');
    const foldersIndex = html.indexOf('Estudos');

    expect(tagsIndex).toBeGreaterThan(-1);
    expect(foldersIndex).toBeGreaterThan(-1);
    expect(tagsIndex).toBeLessThan(foldersIndex);
  });

  it('renderiza o botaozao azul de Gerenciar Tags na secao de tags e abre o modal ao clicar', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [
          { id: '1', folder: 'Estudos', tags: ['filosofia', 'ciencias'] },
        ],
        folders: ['Estudos'],
        collapsed: false,
      },
    });

    const manageTagsBtn = wrapper.find('[data-testid="manage-tags-sidebar-btn"]');
    expect(manageTagsBtn.exists()).toBe(true);
    expect(manageTagsBtn.text()).toContain('Gerenciar Tags');
    expect(manageTagsBtn.classes().some((c) => c.includes('blue'))).toBe(true);

    await manageTagsBtn.trigger('click');
    expect(wrapper.findComponent({ name: 'ManageThemesModal' }).props('isOpen')).toBe(true);
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

  it('embute a lista de tags dentro do card azul de Gerenciar Tags e permite recolher/expandir', async () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items: [
          { id: '1', folder: 'Estudos', tags: ['filosofia', 'ciencias'] },
        ],
        folders: ['Estudos'],
        collapsed: false,
      },
    });

    // As tags devem estar embutidas e visíveis inicialmente
    expect(wrapper.text()).toContain('#filosofia');
    expect(wrapper.text()).toContain('#ciencias');

    const toggleBtn = wrapper.find('[data-testid="toggle-tags-expand-btn"]');
    expect(toggleBtn.exists()).toBe(true);

    // Clica para recolher
    await toggleBtn.trigger('click');
    const tagsContainer = wrapper.find('.animate-in');
    expect(tagsContainer.attributes('style')).toContain('display: none');
  });
});

