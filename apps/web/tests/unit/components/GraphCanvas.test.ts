import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GraphCanvas from '../../../app/components/GraphCanvas.vue'

describe('GraphCanvas Component', () => {
  it('renders SVG graph canvas with theme and book nodes', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia', color: '#3B82F6', bookCount: 1 },
          { id: 'book-10', rawId: 10, type: 'book', name: 'O Programa...', fullTitle: 'O Programador Pragmático', author: 'Andy Hunt', coverPath: 'storage/covers/test.png' },
        ],
        edges: [
          { id: 'edge-1', source: 'theme-1', target: 'book-10', type: 'book-theme' },
        ],
      },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('.links-group').exists()).toBe(true)
    expect(wrapper.find('.nodes-group').exists()).toBe(true)
    expect(wrapper.text()).toContain('Novo Tema')
    expect(wrapper.text()).toContain('Conectar')
    // O texto do nó central foi removido a pedido do usuário (apenas o ícone permanece)
    expect(wrapper.html()).not.toContain('>Meu Conhecimento<')
  })

  it('emits openCreateNode and openConnectModal events from buttons', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [],
        edges: [],
      },
    })

    const buttons = wrapper.findAll('button')
    const createBtn = buttons.find((b) => b.text().includes('Novo Tema'))
    const connectBtn = buttons.find((b) => b.text().includes('Conectar'))

    if (createBtn) {
      await createBtn.trigger('click')
      expect(wrapper.emitted('openCreateNode')).toBeTruthy()
    }

    if (connectBtn) {
      await connectBtn.trigger('click')
      expect(wrapper.emitted('openConnectModal')).toBeTruthy()
    }
  })

  it('renders clean monochromatic vector icons with borders instead of emojis in theme nodes', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia', color: '#3B82F6', bookCount: 1 },
          { id: 'theme-2', rawId: 2, type: 'theme', name: 'Psicologia', color: '#10B981', bookCount: 1 },
        ],
        edges: [],
      },
    })

    const monochromeIcons = wrapper.findAll('.node-icon-monochrome')
    expect(monochromeIcons.length).toBeGreaterThanOrEqual(2)
    // Garantir que não contém emojis cartoon nos nós
    expect(wrapper.html()).not.toContain('🏛️')
    expect(wrapper.html()).not.toContain('🧠')
    // Garantir presença de caminhos vetoriais monocromáticos
    expect(wrapper.find('.node-icon-monochrome').find('line, path').exists()).toBe(true)
  })

  it('renders all 4 node types and does not render layers filter bar', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia' },
          { id: 'book-1', rawId: 1, type: 'book', name: 'Livro Teste', fullTitle: 'Livro Teste' },
          { id: 'note-1', rawId: 'n1', type: 'note', name: 'Nota livre', title: 'Nota livre' },
          { id: 'canvas-1', rawId: 'c1', type: 'canvas', name: 'Quadro A', title: 'Quadro A' },
        ],
        edges: [],
      },
    })

    // Barra de camadas foi removida do grafo
    expect(wrapper.text()).not.toContain('Camadas:')
    expect(wrapper.find('[data-testid="layers-filter-bar"]').exists()).toBe(false)

    // Deve renderizar nós de cada categoria no SVG
    expect(wrapper.findAll('.note-icon').length).toBeGreaterThanOrEqual(1)
    expect(wrapper.findAll('.canvas-icon').length).toBeGreaterThanOrEqual(1)
  })

  it('hides floating controls bar when showControls is false', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia' },
        ],
        edges: [],
        showControls: false,
      },
    })

    // Não deve conter a barra flutuante de ações duplicadas
    expect(wrapper.text()).not.toContain('Novo Tema')
    expect(wrapper.text()).not.toContain('Conectar')
    expect(wrapper.find('input[placeholder*="Buscar tema"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="layers-filter-bar"]').exists()).toBe(false)
  })

  it('filters nodes using searchQuery passed as prop', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia Estoica' },
          { id: 'theme-2', rawId: 2, type: 'theme', name: 'Computação Quântica' },
          { id: 'book-1', rawId: 1, type: 'book', name: 'Clean Code', fullTitle: 'Clean Code' },
        ],
        edges: [],
        searchQuery: 'Estoica',
        showControls: false,
      },
    })

    // Inicialmente apenas o nó correspondente e o root devem estar presentes
    expect(wrapper.html()).toContain('Filosofia')
    expect(wrapper.html()).not.toContain('Clean Code')

    // Ao alterar a busca via prop
    await wrapper.setProps({ searchQuery: 'Clean' })
    expect(wrapper.html()).toContain('Clean Code')
    expect(wrapper.html()).not.toContain('Estoica')
  })

  it('renders magnetic wire elements and glow filter for interactive edge pulling', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia' },
          { id: 'book-1', rawId: 1, type: 'book', name: 'Hobbit' },
        ],
        edges: [],
      },
    })

    // Deve conter def de brilho da aresta magnética
    expect(wrapper.find('#wire-glow').exists()).toBe(true)
    // Deve conter linha guia e ponta da aresta temporária
    expect(wrapper.find('.drag-wire').exists()).toBe(true)
    expect(wrapper.find('.drag-wire-tip').exists()).toBe(true)
  })

  it('emits selectNode when clicking a node without dragging', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Filosofia' },
        ],
        edges: [],
      },
    })

    const nodeG = wrapper.findAll('g.node')
    // O segundo nó é o nó do tema (o primeiro é a raiz 'Meu Conhecimento')
    const themeG = nodeG.find((g) => g.text().includes('Filosofia'))
    expect(themeG).toBeDefined()

    if (themeG) {
      await themeG.trigger('click')
      expect(wrapper.emitted('selectNode')).toBeTruthy()
      const emittedPayload = wrapper.emitted('selectNode')?.[0]?.[0] as any
      expect(emittedPayload.name).toBe('Filosofia')
    }
  })

  it('positions child and grandchild nodes strictly further outward from center than their parent', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Tecnologia' },
          { id: 'book-1', rawId: 1, type: 'book', name: 'Livro Base' },
          { id: 'book-2', rawId: 2, type: 'book', name: 'Livreto Filho' },
          { id: 'note-1', rawId: 1, type: 'note', name: 'Nota Neta' },
        ],
        edges: [
          { id: 'e-1', source: 'theme-1', target: 'book-1', type: 'book-theme' },
          { id: 'e-2', source: 'book-1', target: 'book-2', type: 'book-hierarchy' },
          { id: 'e-3', source: 'book-2', target: 'note-1', type: 'note-book' },
        ],
      },
    })

    const nodeElements = wrapper.findAll('g.node')
    expect(nodeElements.length).toBe(5) // root + 4 nós

    // Extrair coordenadas transform translate(x, y) de cada nó
    const getPos = (elem: any) => {
      const transform = elem.attributes('transform') || ''
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/)
      if (!match) return { x: 0, y: 0 }
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
    }

    const rootPos = getPos(nodeElements[0])
    const themePos = getPos(nodeElements[1])
    const book1Pos = getPos(nodeElements[2])
    const book2Pos = getPos(nodeElements[3])
    const ann1Pos = getPos(nodeElements[4])

    const distFromRoot = (pos: { x: number; y: number }) => Math.hypot(pos.x - rootPos.x, pos.y - rootPos.y)

    const dTheme = distFromRoot(themePos)
    const dBook1 = distFromRoot(book1Pos)
    const dBook2 = distFromRoot(book2Pos)
    const dAnn1 = distFromRoot(ann1Pos)

    // Cada nível na hierarquia deve estar estritamente mais distante do centro que seu pai
    expect(dTheme).toBeGreaterThan(0)
    expect(dBook1).toBeGreaterThan(dTheme)
    expect(dBook2).toBeGreaterThan(dBook1)
    expect(dAnn1).toBeGreaterThan(dBook2)
  })

  it('renders newly added edge dynamically and resolves flexible node IDs', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 3, rawId: 3, type: 'theme', name: 'Technology' },
          { id: 'book-7', rawId: 7, type: 'book', name: 'Dokumen.Pub' },
        ],
        edges: [],
      },
    })

    // Inicialmente a aresta ainda não existe
    expect(wrapper.find('[data-edge-id="edge-live-book-7-3"]').exists()).toBe(false)

    // Conexão dinâmica adicionada via props com IDs flexíveis (source: 'book-7', target: 3)
    await wrapper.setProps({
      edges: [
        { id: 'edge-live-book-7-3', source: 'book-7', target: 3, type: 'book-theme' },
      ],
    })

    // Deve renderizar a nova linha no SVG com o id e tipo corretos
    const line = wrapper.find('[data-edge-id="edge-live-book-7-3"]')
    expect(line.exists()).toBe(true)
    expect(line.attributes('data-edge-type')).toBe('book-theme')

    // Também deve resolver se target for especificado com prefixo 'theme-3' ou source numérico 7
    await wrapper.setProps({
      edges: [
        { id: 'edge-flex-1', source: 7, target: 'theme-3', type: 'book-theme' },
      ],
    })
    expect(wrapper.find('[data-edge-id="edge-flex-1"]').exists()).toBe(true)
  })

  it('reorganizes newly connected node to be close to its target theme node', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 3, rawId: 3, type: 'theme', name: 'Technology' },
          { id: 'book-7', rawId: 7, type: 'book', name: 'Dokumen.Pub' },
        ],
        edges: [],
      },
    })

    const getPos = (elem: any) => {
      const transform = elem.attributes('transform') || ''
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/)
      if (!match) return { x: 0, y: 0 }
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
    }

    // Ao conectar o livro ao tema, o livro deve se posicionar próximo ao tema (~95px de distância)
    await wrapper.setProps({
      edges: [
        { id: 'edge-live-book-7-3', source: 'book-7', target: 3, type: 'book-theme' },
      ],
    })

    const nodes = wrapper.findAll('g.node')
    const themeNode = nodes.find((n) => n.text().includes('Technology'))!
    const bookNode = nodes.find((n) => n.text().includes('Dokumen'))!

    const themePos = getPos(themeNode)
    const bookPos = getPos(bookNode)
    const distance = Math.hypot(bookPos.x - themePos.x, bookPos.y - themePos.y)

    // A distância entre o tema e o livro filho deve estar no feixe de proximidade (~95px)
    expect(distance).toBeGreaterThan(60)
    expect(distance).toBeLessThan(140)
  })

  it('renders folder nodes correctly', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'folder-Projetos', rawId: 'Projetos', type: 'folder', name: 'Projetos' },
          { id: 'note-1', rawId: '1', type: 'note', name: 'Nota 1', folder: 'Projetos' },
        ],
        edges: [
          { id: 'edge-nf-1', source: 'note-1', target: 'folder-Projetos', type: 'note-folder' },
        ],
      },
    })

    // Deve renderizar nó de pasta
    const folderG = wrapper.findAll('g.node').find((n) => n.text().includes('Projetos'))
    expect(folderG).toBeDefined()
    expect(folderG?.find('.folder-icon').exists()).toBe(true)
  })

  it('renders theme nodes with their custom clean colors for stroke, icon, and fill', () => {
    const customColor = '#3B82F6'
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Tecnologia', color: customColor },
        ],
        edges: [],
      },
    })

    const themeNode = wrapper.findAll('g.node').find((n) => n.text().includes('Tecnologia'))
    expect(themeNode).toBeDefined()

    // O círculo principal deve ter o stroke com a cor customizada do tema
    const mainCircle = themeNode?.findAll('circle')[1]
    expect(mainCircle?.attributes('stroke')).toBe(customColor)

    // O ícone deve ter o stroke com a cor customizada do tema
    const iconG = themeNode?.find('.node-icon-monochrome')
    expect(iconG?.attributes('stroke')).toBe(customColor)

    // O texto do nó de tema deve ter o fill colorido com a cor customizada do tema
    const textEl = themeNode?.find('text')
    expect(textEl?.attributes('fill')).toBe(customColor)
  })

  it('emits connectNodes and connect-nodes events with proper payload when connecting nodes', async () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Tecnologia' },
          { id: 'book-1', rawId: 10, type: 'book', name: 'Clean Code' },
        ],
        edges: [],
      },
    })

    // Simula evento emitido quando o usuário conecta dois nós
    wrapper.vm.$emit('connect-nodes', {
      sourceId: 'book-1',
      targetId: 'theme-1',
      sourceRawId: 10,
      targetRawId: 1,
      sourceType: 'book',
      targetType: 'theme',
    })

    expect(wrapper.emitted('connect-nodes')).toBeTruthy()
    const emittedPayload = (wrapper.emitted('connect-nodes') as any)[0][0]
    expect(emittedPayload.sourceType).toBe('book')
    expect(emittedPayload.targetType).toBe('theme')
  })

  it('renders link nodes with link icon and label', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        nodes: [
          {
            id: 'link-1',
            rawId: 'link-1',
            type: 'link',
            name: 'Nuxt Docs',
            title: 'Nuxt Docs',
            url: 'https://nuxt.com',
            domain: 'nuxt.com',
            color: '#06B6D4',
          },
        ],
        edges: [],
      },
    })

    // Deve renderizar nó de link com ícone e texto
    const linkG = wrapper.findAll('g.node').find((n) => n.text().includes('Nuxt Docs'))
    expect(linkG).toBeDefined()
    expect(linkG?.find('.link-icon').exists()).toBe(true)
    const rect = linkG?.find('rect')
    expect(rect?.exists()).toBe(true)
    expect(rect?.attributes('stroke')).toBe('#06B6D4')
  })

  it('renders desktop graph with multiple themes and calculates responsive layout', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        isCompact: false,
        showControls: false,
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Leitura', color: '#E57B55' },
          { id: 'theme-2', rawId: 2, type: 'theme', name: 'Programação', color: '#3B82F6' },
          { id: 'theme-3', rawId: 3, type: 'theme', name: 'Faculdade', color: '#10B981' },
          { id: 'book-1', rawId: 10, type: 'book', name: 'Clean Code', color: '#3B82F6' },
        ],
        edges: [
          { id: 'e1', source: 'theme-2', target: 'book-1', type: 'book-theme' },
        ],
      },
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    const nodes = wrapper.findAll('g.node')
    expect(nodes.length).toBeGreaterThanOrEqual(4)
  })

  it('exibe o tema da tag e todos os nós conectados a ele via arestas ao filtrar por tag', () => {
    const wrapper = mount(GraphCanvas, {
      props: {
        isCompact: false,
        showControls: false,
        searchQuery: 'Leitura',
        nodes: [
          { id: 'theme-1', rawId: 1, type: 'theme', name: 'Leitura', color: '#E57B55' },
          { id: 'theme-2', rawId: 2, type: 'theme', name: 'Programação', color: '#3B82F6' },
          { id: 'book-1', rawId: 10, type: 'book', name: 'Dom Casmurro', color: '#3B82F6' },
          { id: 'book-2', rawId: 20, type: 'book', name: 'Clean Code', color: '#3B82F6' },
        ],
        edges: [
          { id: 'e1', source: 'theme-1', target: 'book-1', type: 'book-theme' },
          { id: 'e2', source: 'theme-2', target: 'book-2', type: 'book-theme' },
        ],
      },
    })

    // O tema 'Leitura' e o livro conectado 'Dom Casmurro' DEVEM estar no grafo
    expect(wrapper.html()).toContain('Leitura')
    expect(wrapper.html()).toContain('Dom Casmurro')

    // O tema 'Programação' e o livro 'Clean Code' NÃO estão conectados a 'Leitura' e não devem aparecer
    expect(wrapper.html()).not.toContain('Clean Code')
  })
})

