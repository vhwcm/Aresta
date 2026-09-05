import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StreakCelebrationModal from '../../../app/components/StreakCelebrationModal.vue'
import { useStreakCelebration } from '../../../app/composables/useStreakCelebration'

describe('StreakCelebrationModal', () => {
  it('não renderiza conteúdo quando isCelebrationOpen é falso', () => {
    const { isCelebrationOpen } = useStreakCelebration()
    isCelebrationOpen.value = false
    const wrapper = mount(StreakCelebrationModal)
    expect(wrapper.text()).toBe('')
  })
})
