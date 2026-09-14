import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import NavbarPageConnector from '../../../app/components/NavbarPageConnector.vue'
import * as authComposable from '../../../app/composables/useAuth'

const mockRoute = reactive({ path: '/library' })

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute
}))

describe('NavbarPageConnector Component', () => {
  const isLoggedInRef = ref(true)

  beforeEach(() => {
    isLoggedInRef.value = true
    mockRoute.path = '/library'
    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      isLoggedIn: isLoggedInRef
    } as any)
  })

  it('renders svg and contour path when user is logged in', () => {
    const wrapper = mount(NavbarPageConnector)

    expect(wrapper.find('svg').exists()).toBe(true)
    const paths = wrapper.findAll('path')
    expect(paths.length).toBeGreaterThanOrEqual(1)
  })

  it('adapts activeIndex according to route path', async () => {
    mockRoute.path = '/canvas'
    const wrapper = mount(NavbarPageConnector)

    expect(wrapper.vm.activeIndex).toBe(2)

    mockRoute.path = '/revisao'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.activeIndex).toBe(3)
  })

  it('is hidden on immersive reader pages', () => {
    mockRoute.path = '/reader/123'
    const wrapper = mount(NavbarPageConnector)

    expect(wrapper.find('svg').exists()).toBe(false)
  })

  it('mantém selecionada a última aba direta quando estiver em rota indireta como /beneficios', async () => {
    mockRoute.path = '/revisao'
    const wrapper = mount(NavbarPageConnector)
    expect(wrapper.vm.activeIndex).toBe(3)

    mockRoute.path = '/beneficios'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.activeIndex).toBe(3)
  })
})
