import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StreakCelebrationModal from '../../../app/components/StreakCelebrationModal.vue'
import StreakShareModal from '../../../app/components/StreakShareModal.vue'
import { useStreakCelebration } from '../../../app/composables/useStreakCelebration'

describe('Streak Celebration & Share Modals', () => {
  it('renders StreakCelebrationModal when celebration is triggered', async () => {
    const { triggerCelebration, isCelebrationOpen } = useStreakCelebration()
    triggerCelebration(5, 7)

    expect(isCelebrationOpen.value).toBe(true)

    const wrapper = mount(StreakCelebrationModal, {
      global: {
        stubs: {
          Teleport: true
        }
      }
    })

    expect(wrapper.html()).toContain('Ofensiva Mantida')
    expect(wrapper.html()).toContain('Compartilhar Conquista')
  })

  it('renders StreakShareModal when share is opened', async () => {
    const { openShare, isShareModalOpen } = useStreakCelebration()
    openShare()

    expect(isShareModalOpen.value).toBe(true)

    const wrapper = mount(StreakShareModal, {
      global: {
        stubs: {
          Teleport: true
        }
      }
    })

    expect(wrapper.html()).toContain('Compartilhar Ofensiva')
    expect(wrapper.html()).toContain('WhatsApp')
    expect(wrapper.html()).toContain('Instagram')
    expect(wrapper.html()).toContain('LinkedIn')
  })
})
