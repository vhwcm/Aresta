import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../app/app.vue'

describe('App Root (app.vue)', () => {
  it('renders NuxtPage and persistent BottomNavbar along with global dialogs', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          NuxtPage: { template: '<div data-testid="nuxt-page-stub">Page Content</div>' },
          BottomNavbar: { template: '<div data-testid="bottom-navbar-stub">Navbar</div>' },
          CommandPalette: { template: '<div data-testid="command-palette-stub" />' },
          SettingsModal: { template: '<div data-testid="settings-modal-stub" />' },
          StreakCelebrationModal: { template: '<div data-testid="streak-celebration-stub" />' },
          StreakShareModal: { template: '<div data-testid="streak-share-stub" />' }
        }
      }
    })

    expect(wrapper.find('[data-testid="nuxt-page-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="bottom-navbar-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="command-palette-stub"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="settings-modal-stub"]').exists()).toBe(true)
  })
})
