import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CanvasStrokeLayer from '../../../app/components/canvas/CanvasStrokeLayer.vue';
import type { InkingStroke } from '../../../app/interfaces/canvas';

describe('CanvasStrokeLayer component', () => {
  it('renderiza camada SVG vazia quando não há traços', () => {
    const wrapper = mount(CanvasStrokeLayer, {
      props: {
        strokes: [],
        activeStroke: null,
      },
    });

    expect(wrapper.find('svg.canvas-stroke-layer').exists()).toBe(true);
    expect(wrapper.findAll('.persisted-strokes path')).toHaveLength(0);
    expect(wrapper.find('.active-stroke').exists()).toBe(false);
  });

  it('renderiza traços persistidos com caminhos SVG gerados', () => {
    const strokes: InkingStroke[] = [
      {
        id: 'stroke-1',
        points: [
          { x: 10, y: 10, pressure: 0.5 },
          { x: 20, y: 20, pressure: 0.5 },
          { x: 30, y: 30, pressure: 0.5 },
        ],
        color: '#E57B55',
        width: 3,
      },
      {
        id: 'stroke-2',
        points: [
          { x: 100, y: 100, pressure: 0.8 },
          { x: 150, y: 150, pressure: 0.8 },
        ],
        color: '#3B82F6',
        width: 5,
        opacity: 0.9,
      },
    ];

    const wrapper = mount(CanvasStrokeLayer, {
      props: {
        strokes,
        activeStroke: null,
      },
    });

    const paths = wrapper.findAll('.persisted-strokes path');
    expect(paths).toHaveLength(2);
    expect(paths[0]?.attributes('fill')).toBe('#E57B55');
    expect(paths[0]?.attributes('d')).toContain('M');
    expect(paths[1]?.attributes('fill')).toBe('#3B82F6');
  });

  it('renderiza traço ativo em tempo real', () => {
    const activeStroke: InkingStroke = {
      id: 'active-1',
      points: [
        { x: 50, y: 50, pressure: 0.5 },
        { x: 60, y: 70, pressure: 0.5 },
      ],
      color: '#10B981',
      width: 4,
    };

    const wrapper = mount(CanvasStrokeLayer, {
      props: {
        strokes: [],
        activeStroke,
      },
    });

    const activeGroup = wrapper.find('.active-stroke');
    expect(activeGroup.exists()).toBe(true);
    const activePath = activeGroup.find('path');
    expect(activePath.attributes('fill')).toBe('#10B981');
    expect(activePath.attributes('d')).toContain('M');
  });
});
