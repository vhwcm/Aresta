import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBackButton from '~/components/AppBackButton.vue'

const mockBack = vi.fn()
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush
  }),
  useRoute: () => ({
    path: '/library'
  })
}))

describe('AppBackButton.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState(null, '', '/')
  })

  it('renders correctly with default text and editorial variant', () => {
    const wrapper = mount(AppBackButton)

    expect(wrapper.text()).toContain('Voltar')
    expect(wrapper.attributes('title')).toBe('Voltar para a página anterior')
    expect(wrapper.attributes('aria-label')).toBe('Voltar para a página anterior')
    expect(wrapper.classes()).toContain('font-technical')
  })

  it('renders custom text and custom title', () => {
    const wrapper = mount(AppBackButton, {
      props: {
        text: 'Voltar para a Estante',
        title: 'Retornar para a estante'
      }
    })

    expect(wrapper.text()).toContain('Voltar para a Estante')
    expect(wrapper.attributes('title')).toBe('Retornar para a estante')
  })

  it('renders button variant styling', () => {
    const wrapper = mount(AppBackButton, {
      props: {
        variant: 'button'
      }
    })

    expect(wrapper.classes()).toContain('rounded-xl')
    expect(wrapper.classes()).toContain('border-divider')
  })

  it('renders chip variant styling', () => {
    const wrapper = mount(AppBackButton, {
      props: {
        variant: 'chip'
      }
    })

    expect(wrapper.classes()).toContain('rounded-full')
  })

  it('renders icon-only variant with accessible text', () => {
    const wrapper = mount(AppBackButton, {
      props: {
        variant: 'icon',
        text: 'Voltar'
      }
    })

    const textSpan = wrapper.find('.sr-only')
    expect(textSpan.exists()).toBe(true)
    expect(textSpan.text()).toBe('Voltar')
  })

  it('calls router.back() when history state back exists', async () => {
    window.history.replaceState({ back: '/' }, '', '/library')

    const wrapper = mount(AppBackButton)
    await wrapper.trigger('click')

    expect(mockBack).toHaveBeenCalledTimes(1)
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('calls router.push(fallback) when no history back state exists', async () => {
    window.history.replaceState(null, '', '/library')

    const wrapper = mount(AppBackButton, {
      props: {
        fallback: '/conta'
      }
    })
    await wrapper.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/conta')
  })

  it('executes customClick callback when provided', async () => {
    const customSpy = vi.fn()
    const wrapper = mount(AppBackButton, {
      props: {
        customClick: customSpy
      }
    })

    await wrapper.trigger('click')

    expect(customSpy).toHaveBeenCalledTimes(1)
    expect(mockBack).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('emits click event on click', async () => {
    const wrapper = mount(AppBackButton)
    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
