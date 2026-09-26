import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DiarioPage from '~/pages/diario.vue'

const mockViewLayout = ref<'graph' | 'grid' | 'journal' | 'note-editor'>('graph')

vi.mock('~/composables/useWorkspaceSidebar', () => ({
  useWorkspaceSidebar: () => ({
    viewLayout: mockViewLayout
  })
}))

describe('Diário Page (/diario)', () => {
  beforeEach(() => {
    mockViewLayout.value = 'graph'
  })

  it('renders JournalView component and sets viewLayout to journal', async () => {
    const wrapper = mount(DiarioPage, {
      global: {
        stubs: {
          JournalView: {
            template: '<div data-testid="journal-view-stub">Mock JournalView</div>'
          }
        }
      }
    })

    expect(wrapper.find('[data-testid="diario-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="journal-view-stub"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Mock JournalView')
    expect(mockViewLayout.value).toBe('journal')
  })
})
