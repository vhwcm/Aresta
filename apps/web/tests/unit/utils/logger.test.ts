import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isProductionMode, logError, logWarn, formatErrorMessage } from '../../../app/utils/logger'

describe('Logger utility', () => {
  const originalEnv = process.env.IS_PRODUCTION

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    process.env.IS_PRODUCTION = originalEnv
  })

  it('detects development mode when IS_PRODUCTION is false', () => {
    process.env.IS_PRODUCTION = 'false'
    expect(isProductionMode()).toBe(false)
  })

  it('detects production mode when IS_PRODUCTION is true', () => {
    process.env.IS_PRODUCTION = 'true'
    expect(isProductionMode()).toBe(true)
  })

  it('logs errors in development mode', () => {
    process.env.IS_PRODUCTION = 'false'
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logError('test error')
    expect(consoleSpy).toHaveBeenCalledWith('test error')
  })

  it('suppresses error logging in production mode', () => {
    process.env.IS_PRODUCTION = 'true'
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    logError('test error')
    expect(consoleSpy).not.toHaveBeenCalled()
  })

  it('logs warnings in development mode', () => {
    process.env.IS_PRODUCTION = 'false'
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logWarn('test warning')
    expect(consoleSpy).toHaveBeenCalledWith('test warning')
  })

  it('suppresses warnings in production mode', () => {
    process.env.IS_PRODUCTION = 'true'
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logWarn('test warning')
    expect(consoleSpy).not.toHaveBeenCalled()
  })

  it('formats error message with full details in dev mode', () => {
    process.env.IS_PRODUCTION = 'false'
    const err = new Error('detailed message')
    expect(formatErrorMessage(err, 'Fallback')).toBe('detailed message')
  })

  it('formats error message with fallback message in prod mode', () => {
    process.env.IS_PRODUCTION = 'true'
    const err = new Error('detailed message')
    expect(formatErrorMessage(err, 'Fallback')).toBe('Fallback')
  })
})
