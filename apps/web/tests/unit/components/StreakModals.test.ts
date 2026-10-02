import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StreakCelebrationModal from '../../../app/components/StreakCelebrationModal.vue'
import { useStreakCelebration } from '../../../app/composables/useStreakCelebration'

describe('StreakModals', () => {
  it('não renderiza conteúdo quando isCelebrationOpen é falso', () => {
    const { isCelebrationOpen } = useStreakCelebration()
    isCelebrationOpen.value = false
    const wrapper = mount(StreakCelebrationModal)
    expect(wrapper.text()).toBe('')
  })

  it('renderiza StreakCelebrationModal sem classes de blur quando aberto', () => {
    const { isCelebrationOpen, celebrationStreakDays } = useStreakCelebration()
    isCelebrationOpen.value = true
    celebrationStreakDays.value = 5
    const wrapper = mount(StreakCelebrationModal)
    const overlay = wrapper.find('.fixed')
    expect(overlay.exists()).toBe(true)
    expect(overlay.classes()).not.toContain('backdrop-blur-sm')
    expect(overlay.classes()).not.toContain('backdrop-blur-md')
  })
})
