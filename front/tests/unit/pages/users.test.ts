import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UsersPage from '~/pages/users.vue'

describe('Users Page Component', () => {
  it('renders user management header and title correctly', () => {
    const wrapper = mount(UsersPage, {
      global: {
        stubs: {
          UsersIcon: true,
          UserPlusIcon: true,
          SearchIcon: true,
          Edit3Icon: true,
          Trash2Icon: true,
          UserXIcon: true,
          XIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Gestão de Usuários')
    expect(wrapper.text()).toContain('Administração de Acessos')
  })
})
