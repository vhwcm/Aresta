import { describe, it, expect, beforeEach } from 'vitest'
import { useCommandPalette } from '../../../app/composables/useCommandPalette'

describe('useCommandPalette Composable', () => {
  const palette = useCommandPalette()

  beforeEach(() => {
    palette.close()
  })

  it('initializes with isOpen = false', () => {
    expect(palette.isOpen.value).toBe(false)
  })

  it('opens and closes command palette', () => {
    palette.open()
    expect(palette.isOpen.value).toBe(true)

    palette.close()
    expect(palette.isOpen.value).toBe(false)
  })

  it('toggles command palette state', () => {
    palette.toggle()
    expect(palette.isOpen.value).toBe(true)

    palette.toggle()
    expect(palette.isOpen.value).toBe(false)
  })
})

