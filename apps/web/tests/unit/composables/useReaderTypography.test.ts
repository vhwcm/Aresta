import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useReaderTypography, READER_FONTS } from '../../../app/composables/useReaderTypography'

describe('useReaderTypography', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides all 5 predefined fonts', () => {
    const { fonts } = useReaderTypography()
    expect(fonts).toHaveLength(5)
    const ids = fonts.map((f) => f.id)
    expect(ids).toContain('newsreader')
    expect(ids).toContain('literata')
    expect(ids).toContain('lora')
    expect(ids).toContain('merriweather')
    expect(ids).toContain('inter')
  })

  it('defaults to newsreader when no storage key exists', () => {
    const { activeFontId, currentFont } = useReaderTypography()
    expect(activeFontId.value).toBe('newsreader')
    expect(currentFont.value.id).toBe('newsreader')
    expect(currentFont.value.fontFamily).toContain('Newsreader')
  })

  it('updates active font and persists to localStorage', () => {
    const { setFont, activeFontId, currentFont } = useReaderTypography()
    setFont('literata')
    expect(activeFontId.value).toBe('literata')
    expect(currentFont.value.id).toBe('literata')
    expect(currentFont.value.fontFamily).toContain('Literata')
    expect(localStorage.getItem('aresta_reader_font')).toBe('literata')

    setFont('inter')
    expect(activeFontId.value).toBe('inter')
    expect(currentFont.value.name).toBe('Inter')
    expect(localStorage.getItem('aresta_reader_font')).toBe('inter')
  })

  it('ignores invalid font ids', () => {
    const { setFont, activeFontId } = useReaderTypography()
    setFont('fonte_inexistente')
    expect(activeFontId.value).not.toBe('fonte_inexistente')
  })
})
