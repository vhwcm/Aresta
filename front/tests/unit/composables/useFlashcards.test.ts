import { describe, it, expect, vi } from 'vitest'
import { useFlashcards } from '../../../app/composables/useFlashcards'

describe('useFlashcards composable', () => {
  it('initializes with default empty/reactive state', () => {
    const { dailyDeck, firstCard, isLoading, totalCards, reviewedCount } = useFlashcards()
    expect(dailyDeck.value).toBeDefined()
    expect(Array.isArray(dailyDeck.value)).toBe(true)
    expect(isLoading.value).toBe(false)
    expect(totalCards.value).toBe(0)
    expect(reviewedCount.value).toBe(0)
  })

  it('exposes flashcard methods', () => {
    const { fetchDailyDeck, fetchFirstDailyCard, reviewFlashcard, generateBatch } = useFlashcards()
    expect(typeof fetchDailyDeck).toBe('function')
    expect(typeof fetchFirstDailyCard).toBe('function')
    expect(typeof reviewFlashcard).toBe('function')
    expect(typeof generateBatch).toBe('function')
  })
})
