import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DrawingPageCanvas from '../../../app/components/canvas/drawing/DrawingPageCanvas.vue';
import type { DrawingPage } from '../../../app/interfaces/drawing';

describe('DrawingPageCanvas (100% Vector SVG Rendering & Interaction)', () => {
  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn().mockReturnValue(true);
    HTMLElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
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

  it('renderiza camadas SVG vetoriais para fundo e traços em vez de canvas raster', () => {
    const pageWithStrokes: DrawingPage = {
      id: 'page-1',
      pageNumber: 1,
      width: 794,
      height: 1123,
      backgroundType: 'ruled',
      strokes: [
        {
          id: 'stroke-1',
          tool: 'pen',
          color: '#E57B55',
          size: 3,
          opacity: 1,
          points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
        },
        {
          id: 'stroke-2',
          tool: 'highlighter',
          color: '#F59E0B',
          size: 6,
          opacity: 0.35,
          points: [{ x: 50, y: 50 }, { x: 100, y: 50 }],
        },
      ],
    };

    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: pageWithStrokes,
        tool: 'pen',
        color: '#E57B55',
        size: 3,
      },
    });

    // Camada de fundo SVG existe e renderiza pautas
    expect(wrapper.find('svg.drawing-background-layer').exists()).toBe(true);
    expect(wrapper.findAll('.ruled-lines line').length).toBeGreaterThan(0);

    // Camada de traços SVG existe e renderiza os paths dos traços
    expect(wrapper.find('svg.drawing-stroke-layer').exists()).toBe(true);
    const paths = wrapper.findAll('.persisted-strokes path');
    expect(paths).toHaveLength(2);
    expect(paths[0]?.attributes('d')).toContain('M');
    expect(paths[0]?.attributes('fill')).toBe('#E57B55');
    expect(paths[1]?.attributes('style')).toContain('mix-blend-mode: multiply');
  });

  it('finaliza o traço e não continua desenhando se o mouse sair e voltar com botão solto (buttons === 0)', async () => {
    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: defaultPage,
        tool: 'pen',
        color: '#000000',
        size: 3,
      },
    });

    const overlay = wrapper.find('.drawing-interaction-overlay');
    expect(overlay.exists()).toBe(true);

    // 1. Inicia desenho com botão esquerdo pressionado (buttons: 1)
    await overlay.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 50,
      clientY: 50,
    });

    // 2. Move enquanto pressionado
    await overlay.trigger('pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 1,
      clientX: 60,
      clientY: 60,
    });

    // 3. Mouse sai da página, solta o botão e entra novamente com buttons === 0
    await overlay.trigger('pointerenter', {
      pointerId: 1,
      pointerType: 'mouse',
      buttons: 0,
      clientX: 70,
      clientY: 70,
    });

    // Deve ter emitido o traço que foi concluído com path vetorial
    expect(wrapper.emitted('stroke-added')).toBeTruthy();
    expect(wrapper.emitted('stroke-added')?.length).toBe(1);
    const stroke = wrapper.emitted('stroke-added')?.[0]?.[0] as any;
    expect(stroke.path).toContain('M');

    // 4. Mover o mouse novamente sem pressionar botão (buttons === 0)
    await overlay.trigger('pointermove', {
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

    const overlay = wrapper.find('.drawing-interaction-overlay');

    await overlay.trigger('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 20,
      clientY: 20,
    });

    // Move com buttons === 0 (indicando soltura fora do alvo)
    await overlay.trigger('pointermove', {
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

    const overlay = wrapper.find('.drawing-interaction-overlay');

    await overlay.trigger('pointerdown', {
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

    const overlay = wrapper.find('.drawing-interaction-overlay');

    await overlay.trigger('pointerdown', {
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

  it('cria nó de forma geométrica ao clicar na página com ferramenta shape', async () => {
    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: defaultPage,
        tool: 'shape',
        selectedShapeType: 'diamond',
        color: '#E57B55',
        size: 3,
      },
      global: {
        stubs: {
          CanvasNode: true,
          CanvasEdgeLayer: true,
        },
      },
    });

    await wrapper.trigger('click', {
      clientX: 200,
      clientY: 300,
    });

    expect(wrapper.emitted('add-node')).toBeTruthy();
    const createdNode = wrapper.emitted('add-node')?.[0]?.[0] as any;
    expect(createdNode.type).toBe('shape');
    expect(createdNode.shape).toBe('diamond');
    expect(createdNode.color).toBe('#E57B55');
    expect(wrapper.emitted('update:tool')?.[0]).toEqual(['select']);
  });

  it('cria nó de texto ao clicar na página com ferramenta text', async () => {
    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: defaultPage,
        tool: 'text',
        color: '#18181B',
        size: 3,
      },
      global: {
        stubs: {
          CanvasNode: true,
          CanvasEdgeLayer: true,
        },
      },
    });

    await wrapper.trigger('click', {
      clientX: 150,
      clientY: 250,
    });

    expect(wrapper.emitted('add-node')).toBeTruthy();
    const createdNode = wrapper.emitted('add-node')?.[0]?.[0] as any;
    expect(createdNode.type).toBe('loose_text');
    expect(wrapper.emitted('update:tool')?.[0]).toEqual(['select']);
  });

  it('exportToSvgString e exportToDataUrl geram marcação vetorial pura', () => {
    const pageWithStrokes: DrawingPage = {
      id: 'page-1',
      pageNumber: 1,
      width: 794,
      height: 1123,
      backgroundType: 'blank',
      strokes: [
        {
          id: 'stroke-1',
          tool: 'pen',
          color: '#E57B55',
          size: 3,
          opacity: 1,
          points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
        },
      ],
    };

    const wrapper = mount(DrawingPageCanvas, {
      props: {
        page: pageWithStrokes,
        tool: 'select',
        color: '#E57B55',
        size: 3,
      },
    });

    const vm = wrapper.vm as any;
    const svgString = vm.exportToSvgString();
    expect(svgString).toContain('<svg');
    expect(svgString).toContain('viewBox="0 0 794 1123"');
    expect(svgString).toContain('<path');

    const dataUrl = vm.exportToDataUrl();
    expect(dataUrl).toContain('data:image/svg+xml;utf8');
  });

  describe('Multi-Touch & Pinch-to-Zoom Isolation', () => {
    it('aborta o traço imediatamente e não emite stroke-added quando um segundo dedo toca a tela (pinch)', async () => {
      const wrapper = mount(DrawingPageCanvas, {
        props: {
          page: defaultPage,
          tool: 'pen',
          color: '#000000',
          size: 3,
        },
      });

      const overlay = wrapper.find('.drawing-interaction-overlay');

      // 1. Dedo 1 encosta (início de traço provisório)
      overlay.element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 10,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
        bubbles: true,
      }));

      // 2. Dedo 1 se move um pouco
      overlay.element.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 10,
        pointerType: 'touch',
        clientX: 105,
        clientY: 105,
        bubbles: true,
      }));

      // 3. Dedo 2 encosta na tela (segundo toque = pinch detectado!)
      overlay.element.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 11,
        pointerType: 'touch',
        clientX: 200,
        clientY: 200,
        bubbles: true,
      }));

      // 4. Ambos os dedos se movem durante o pinch
      overlay.element.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 10,
        pointerType: 'touch',
        clientX: 90,
        clientY: 90,
        bubbles: true,
      }));
      overlay.element.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 11,
        pointerType: 'touch',
        clientX: 220,
        clientY: 220,
        bubbles: true,
      }));

      // 5. Dedos são levantados
      overlay.element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 10,
        pointerType: 'touch',
        bubbles: true,
      }));
      overlay.element.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 11,
        pointerType: 'touch',
        bubbles: true,
      }));

      // NÃO deve ter emitido nenhum traço desenhado nas duas pontas dos dedos
      expect(wrapper.emitted('stroke-added')).toBeFalsy();
    });

    it('no Modo Caneta (penMode: true), bloqueia traço por toque de dedo (touch) e permite apenas caneta (pen)', async () => {
      const wrapper = mount(DrawingPageCanvas, {
        props: {
          page: defaultPage,
          tool: 'pen',
          color: '#000000',
          size: 3,
          penMode: true,
        },
      });

      const overlay = wrapper.find('.drawing-interaction-overlay');

      // 1. Toque com dedo (touch) não deve iniciar traço
      await overlay.trigger('pointerdown', {
        pointerId: 10,
        pointerType: 'touch',
        button: 0,
        buttons: 1,
        clientX: 50,
        clientY: 50,
      });

      await overlay.trigger('pointermove', {
        pointerId: 10,
        pointerType: 'touch',
        buttons: 1,
        clientX: 70,
        clientY: 70,
      });

      await overlay.trigger('pointerup', {
        pointerId: 10,
        pointerType: 'touch',
      });

      expect(wrapper.emitted('stroke-added')).toBeFalsy();

      // 2. Traço com caneta/stylus (pen) DEVE desenhar normalmente
      await overlay.trigger('pointerdown', {
        pointerId: 11,
        pointerType: 'pen',
        button: 0,
        buttons: 1,
        clientX: 100,
        clientY: 100,
      });

      await overlay.trigger('pointermove', {
        pointerId: 11,
        pointerType: 'pen',
        buttons: 1,
        clientX: 120,
        clientY: 120,
      });

      await overlay.trigger('pointerup', {
        pointerId: 11,
        pointerType: 'pen',
      });

      expect(wrapper.emitted('stroke-added')?.length).toBe(1);
    });
  });
});
