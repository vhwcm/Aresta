import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginPage from '~/pages/login.vue'

describe('Login Page Component', () => {
  it('renders login title and admin credentials banner', () => {
    const wrapper = mount(LoginPage, {
      global: {
        stubs: {
          ShieldCheckIcon: true,
          KeyIcon: true,
          UserIcon: true,
          LockIcon: true,
          ArrowRightIcon: true,
          AlertCircleIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Acessar o Aresta')
    expect(wrapper.text()).toContain('viktor')
    expect(wrapper.text()).toContain('orlaweb123123#')
  })
})
