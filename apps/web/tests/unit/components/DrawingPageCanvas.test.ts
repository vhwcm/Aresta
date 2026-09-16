import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DrawingPageCanvas from '../../../app/components/canvas/drawing/DrawingPageCanvas.vue';
import type { DrawingPage } from '../../../app/interfaces/drawing';

describe('DrawingPageCanvas', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fill: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: '',
      globalCompositeOperation: '',
      globalAlpha: 1,
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(function (contextId: string) {
      if (contextId === '2d') return mockCtx;
      return null;
    }) as any;

    (globalThis as any).Path2D = vi.fn();
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
    HTMLCanvasElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(true);
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 794,
      height: 1123,
    });
  });

  const defaultPage: DrawingPage = {
    id: 'page-1',
    pageNumber: 1,
    width: 794,
    height: 1123,
    backgroundType: 'blank',
    strokes: [],
  };

  it('finaliza o traço e não continua desenhando se o mouse sair e voltar com botão solto (buttons === 0)', async () => {
    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: defaultPage,
        tool: 'pen',
        color: '#000000',
        size: 3,
      },
    });

    const canvas = wrapper.findAll('canvas')[1];

    // 1. Inicia desenho com botão esquerdo pressionado (buttons: 1)
    await canvas.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 50,
      clientY: 50,
    });

    // 2. Move enquanto pressionado
    await canvas.trigger('pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 60,
      clientY: 60,
    });

    // 3. Mouse sai da página, solta o botão e entra novamente com buttons === 0
    await canvas.trigger('pointerenter', {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 0,
      clientX: 70,
      clientY: 70,
    });

    // Deve ter emitido o traço que foi concluído
    expect(wrapper.emitted('stroke-added')).toBeTruthy();
    expect(wrapper.emitted('stroke-added')?.length).toBe(1);

    // 4. Mover o mouse novamente sem pressionar botão (buttons === 0)
    await canvas.trigger('pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 0,
      clientX: 80,
      clientY: 80,
    });

    // NÃO deve emitir novos traços nem continuar desenhando
    expect(wrapper.emitted('stroke-added')?.length).toBe(1);
  });

  it('finaliza o traço quando o evento pointermove detecta buttons === 0', async () => {
    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: defaultPage,
        tool: 'pen',
        color: '#000000',
        size: 3,
      },
    });

    const canvas = wrapper.findAll('canvas')[1];

    await canvas.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 20,
      clientY: 20,
    });

    // Move com buttons === 0 (indicando soltura fora do alvo)
    await canvas.trigger('pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 0,
      clientX: 30,
      clientY: 30,
    });

    expect(wrapper.emitted('stroke-added')).toBeTruthy();
    expect(wrapper.emitted('stroke-added')?.length).toBe(1);
  });

  it('finaliza o traço se a janela disparar pointerup globalmente', async () => {
    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: defaultPage,
        tool: 'pen',
        color: '#000000',
        size: 3,
      },
    });

    const canvas = wrapper.findAll('canvas')[1];

    await canvas.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 20,
      clientY: 20,
    });

    // Simula soltura do mouse fora no objeto window
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));

    expect(wrapper.emitted('stroke-added')).toBeTruthy();
    expect(wrapper.emitted('stroke-added')?.length).toBe(1);
  });

  it('finaliza o traço ao perder o foco da janela (blur)', async () => {
    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: defaultPage,
        tool: 'pen',
        color: '#000000',
        size: 3,
      },
    });

    const canvas = wrapper.findAll('canvas')[1];

    await canvas.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 20,
      clientY: 20,
    });

    // Simula perda de foco da janela (ex: Alt+Tab)
    window.dispatchEvent(new Event('blur'));

    expect(wrapper.emitted('stroke-added')).toBeTruthy();
    expect(wrapper.emitted('stroke-added')?.length).toBe(1);
  });
});
