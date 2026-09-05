import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HandwritingCanvas from '../../../app/components/reader/HandwritingCanvas.vue'

describe('HandwritingCanvas Component', () => {
  let mockCtx: any

  beforeEach(() => {
    mockCtx = {
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      scale: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => {
        const arr = new Uint8ClampedArray(100 * 100 * 4)
        for (let i = 0; i < 50 * 4; i += 4) {
          arr[i + 3] = 255
        }
        return {
          data: arr,
          width: 100,
          height: 100,
        }
      }),
      createImageData: vi.fn((w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
      })),
      putImageData: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      globalCompositeOperation: 'source-over',
    }

    HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement, contextId: string) {
      if (contextId === '2d') {
        return mockCtx
      }
      return null
    }) as any

    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn()
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn()
    HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 500,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    }))

    document.documentElement.removeAttribute('data-theme')
    document.documentElement.classList.remove('dark-theme', 'light-theme')
  })

  it('renderiza os botões da barra de ferramentas e área do canvas', () => {
    const wrapper = mount(HandwritingCanvas)

    expect(wrapper.find('canvas').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Ferramenta Caneta"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Ferramenta Borracha"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Desfazer último traço"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Limpar tela de desenho"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Escreva ou desenhe aqui com mouse, touch ou stylus')
  })

  it('desenha traço visível e com alto contraste com o mouse no modo claro por padrão', async () => {
    const wrapper = mount(HandwritingCanvas)
    const vm = wrapper.vm as any
    const canvas = wrapper.find('canvas')

    // No modo claro padrão, a cor do traço deve ser escura (#18191B) para ser visível no fundo claro
    expect(vm.getStrokeColor()).toBe('#18191B')

    // Dispara evento de mouse down no canvas
    await canvas.trigger('pointerdown', {
      clientX: 50,
      clientY: 60,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })

    expect(mockCtx.beginPath).toHaveBeenCalled()
    expect(mockCtx.arc).toHaveBeenCalled()
    expect(mockCtx.fill).toHaveBeenCalled()
    expect(mockCtx.fillStyle).toBe('#18191B')
    expect(vm.hasStrokes).toBe(true)

    // Move o mouse desenhando uma linha
    await canvas.trigger('pointermove', {
      clientX: 80,
      clientY: 90,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })

    expect(mockCtx.moveTo).toHaveBeenCalled()
    expect(mockCtx.lineTo).toHaveBeenCalled()
    expect(mockCtx.stroke).toHaveBeenCalled()
    expect(mockCtx.strokeStyle).toBe('#18191B')
  })

  it('adapta a cor do traço para modo escuro com alto contraste (#F2F2F2)', async () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.classList.add('dark-theme')

    const wrapper = mount(HandwritingCanvas)
    const vm = wrapper.vm as any
    const canvas = wrapper.find('canvas')

    expect(vm.getStrokeColor()).toBe('#F2F2F2')

    await canvas.trigger('pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })

    expect(mockCtx.fillStyle).toBe('#F2F2F2')

    await canvas.trigger('pointermove', {
      clientX: 120,
      clientY: 130,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })

    expect(mockCtx.strokeStyle).toBe('#F2F2F2')
  })

  it('permite selecionar cores personalizadas e espessura do traço', async () => {
    const wrapper = mount(HandwritingCanvas)
    const vm = wrapper.vm as any
    const canvas = wrapper.find('canvas')

    // Seleciona cor Laranja Aresta (#E57B55)
    const orangeBtn = wrapper.find('button[aria-label="Cor Laranja Aresta"]')
    expect(orangeBtn.exists()).toBe(true)
    await orangeBtn.trigger('click')

    expect(vm.selectedColor).toBe('#E57B55')
    expect(vm.getStrokeColor()).toBe('#E57B55')

    // Seleciona espessura Grossa
    const thickBtn = wrapper.find('button[aria-label="Espessura Grossa"]')
    expect(thickBtn.exists()).toBe(true)
    await thickBtn.trigger('click')

    expect(vm.selectedSize).toBe('thick')

    // Desenha com a nova cor e espessura
    await canvas.trigger('pointerdown', {
      clientX: 20,
      clientY: 30,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })

    expect(mockCtx.fillStyle).toBe('#E57B55')

    await canvas.trigger('pointermove', {
      clientX: 40,
      clientY: 50,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })

    expect(mockCtx.strokeStyle).toBe('#E57B55')
    expect(mockCtx.lineWidth).toBe(8.0)
  })

  it('alterna para borracha e aplica destination-out', async () => {
    const wrapper = mount(HandwritingCanvas)
    const vm = wrapper.vm as any
    const canvas = wrapper.find('canvas')

    const eraserBtn = wrapper.find('button[aria-label="Ferramenta Borracha"]')
    await eraserBtn.trigger('click')

    expect(vm.activeTool).toBe('eraser')

    await canvas.trigger('pointerdown', {
      clientX: 50,
      clientY: 50,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })

    expect(mockCtx.globalCompositeOperation).toBe('destination-out')

    await canvas.trigger('pointermove', {
      clientX: 70,
      clientY: 70,
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
    })

    expect(mockCtx.globalCompositeOperation).toBe('destination-out')
    expect(mockCtx.lineWidth).toBe(24)
  })

  it('executa ação de limpar tela e desfazer', async () => {
    const wrapper = mount(HandwritingCanvas)
    const vm = wrapper.vm as any
    const canvas = wrapper.find('canvas')

    // Desenha
    await canvas.trigger('pointerdown', { clientX: 10, clientY: 10, pointerId: 1, pointerType: 'mouse', buttons: 1 })
    await canvas.trigger('pointermove', { clientX: 20, clientY: 20, pointerId: 1, pointerType: 'mouse', buttons: 1 })
    await canvas.trigger('pointerup', { pointerId: 1, pointerType: 'mouse' })

    expect(vm.hasStrokes).toBe(true)

    // Clica em Limpar
    const clearBtn = wrapper.find('button[aria-label="Limpar tela de desenho"]')
    await clearBtn.trigger('click')

    expect(mockCtx.clearRect).toHaveBeenCalled()
    expect(vm.hasStrokes).toBe(false)
  })

  it('exportForOcr exporta Base64 e valida se está vazio ou preenchido', async () => {
    const wrapper = mount(HandwritingCanvas)
    const vm = wrapper.vm as any
    const canvas = wrapper.find('canvas')

    // Quando vazio
    const emptyResult = vm.exportForOcr()
    expect(emptyResult.isEmpty).toBe(true)
    expect(emptyResult.base64).toBe('')

    // Desenha algo
    await canvas.trigger('pointerdown', { clientX: 15, clientY: 15, pointerId: 1, pointerType: 'mouse', buttons: 1 })
    await canvas.trigger('pointermove', { clientX: 35, clientY: 35, pointerId: 1, pointerType: 'mouse', buttons: 1 })
    await canvas.trigger('pointerup', { pointerId: 1, pointerType: 'mouse' })

    // Com dados simulados no ImageData
    const drawnResult = vm.exportForOcr()
    expect(drawnResult.isEmpty).toBe(false)
    expect(drawnResult.base64).toContain('data:image/png;base64,')
  })
})
