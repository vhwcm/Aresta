import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AiMarkdown from '../../../app/components/AiMarkdown.vue'

describe('AiMarkdown Component', () => {
  it('renders bold and italic text correctly', () => {
    const wrapper = mount(AiMarkdown, {
      props: {
        content: '**Texto em Negrito** e *Texto em Itálico*',
      },
    })

    expect(wrapper.find('strong').exists()).toBe(true)
    expect(wrapper.find('strong').text()).toBe('Texto em Negrito')
    expect(wrapper.find('em').exists()).toBe(true)
    expect(wrapper.find('em').text()).toBe('Texto em Itálico')
  })

  it('renders headers correctly', () => {
    const wrapper = mount(AiMarkdown, {
      props: {
        content: '# Título Principal\n## Subtítulo',
      },
    })

    expect(wrapper.find('h1').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Título Principal')
    expect(wrapper.find('h2').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Subtítulo')
  })

  it('renders lists correctly', () => {
    const wrapper = mount(AiMarkdown, {
      props: {
        content: '- Item 1\n- Item 2',
      },
    })

    expect(wrapper.find('ul').exists()).toBe(true)
    expect(wrapper.findAll('li')).toHaveLength(2)
  })

  it('renders code blocks correctly', () => {
    const wrapper = mount(AiMarkdown, {
      props: {
        content: '```javascript\nconst x = 10;\n```',
      },
    })

    expect(wrapper.find('pre').exists()).toBe(true)
    expect(wrapper.find('code').exists()).toBe(true)
  })
})
