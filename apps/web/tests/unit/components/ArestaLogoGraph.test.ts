import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ArestaLogoGraph from '../../../app/components/ArestaLogoGraph.vue';

describe('ArestaLogoGraph Component', () => {
  it('renders SVG with letter A graph structure by default', () => {
    const wrapper = mount(ArestaLogoGraph, {
      props: {
        size: 40,
        title: 'Aresta Início',
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('.edges-layer').exists()).toBe(true);
    expect(wrapper.find('.nodes-layer').exists()).toBe(true);
    expect(wrapper.findAll('.node-wrap').length).toBeGreaterThanOrEqual(5);
  });

  it('renders official PNG image when useImage is true', () => {
    const wrapper = mount(ArestaLogoGraph, {
      props: {
        size: 34,
        useImage: true,
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    });

    const img = wrapper.find('[data-testid="aresta-logo-img"]');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('/logo_aresta_sem_fundo.png');
    expect(wrapper.find('svg').exists()).toBe(false);
  });
});
