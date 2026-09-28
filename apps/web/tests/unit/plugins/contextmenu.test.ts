import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.hoisted(() => {
  (globalThis as any).defineNuxtPlugin = (fn: any) => fn
})

import contextmenuPlugin, { handleContextMenu } from '~/plugins/contextmenu.client'

describe('contextmenu.client plugin', () => {
  let addEventListenerSpy: any

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registra o listener de contextmenu em modo capture', () => {
    const mockNuxtApp: any = {}
    contextmenuPlugin(mockNuxtApp)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'contextmenu',
      handleContextMenu,
      { capture: true },
    )
  })

  it('chama preventDefault() em elementos comuns (não editáveis)', () => {
    const div = document.createElement('div')
    const preventDefault = vi.fn()
    const mockEvent = {
      target: div,
      preventDefault,
    } as unknown as MouseEvent

    handleContextMenu(mockEvent)
    expect(preventDefault).toHaveBeenCalled()
  })

  it('NÃO chama preventDefault() dentro de input ou textarea', () => {
    const input = document.createElement('input')
    const preventDefault = vi.fn()
    const mockEvent = {
      target: input,
      preventDefault,
    } as unknown as MouseEvent

    handleContextMenu(mockEvent)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('NÃO chama preventDefault() dentro de elemento contenteditable', () => {
    const editableDiv = document.createElement('div')
    editableDiv.setAttribute('contenteditable', 'true')
    const childSpan = document.createElement('span')
    editableDiv.appendChild(childSpan)

    const preventDefault = vi.fn()
    const mockEvent = {
      target: childSpan,
      preventDefault,
    } as unknown as MouseEvent

    handleContextMenu(mockEvent)
    expect(preventDefault).not.toHaveBeenCalled()
  })
})
