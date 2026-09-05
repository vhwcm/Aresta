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

  it('renderiza contagem total e itens sem pasta', () => {
    const wrapper = mount(FolderTagSidebar, {
      props: {
        items,
        folders,
        title: 'Quadros',
        itemLabel: 'quadros',
      },
    });

    expect(wrapper.text()).toContain('Quadros');
    expect(wrapper.text()).toContain('Todos os quadros');
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

    const createNoteBtn = wrapper.find('button[title="Criar nova nota"]');
    expect(createNoteBtn.exists()).toBe(true);
    await createNoteBtn.trigger('click');

    expect(wrapper.emitted('create-note')).toBeTruthy();
  });
});

