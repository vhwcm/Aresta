import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReaderProgressScrubber from '../../../app/components/reader/navigation/ReaderProgressScrubber.vue'
import ReaderTocDrawer from '../../../app/components/reader/navigation/ReaderTocDrawer.vue'
import ReaderBackChip from '../../../app/components/reader/navigation/ReaderBackChip.vue'
import ReaderGoToField from '../../../app/components/reader/navigation/ReaderGoToField.vue'
import { useReaderStore } from '../../../app/stores/readerStore'
import { useReadingNavigation } from '../../../app/composables/reader/useReadingNavigation'

describe('Navigation Components', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('ReaderProgressScrubber', () => {
    it('renders progress bar with current unit', () => {
      const store = useReaderStore()
      store.document = {
        totalPages: 100,
        type: 'pdf',
      } as any
      store.currentPage = 42

      const wrapper = mount(ReaderProgressScrubber)
      const input = wrapper.find('input[type="range"]')
      expect(input.exists()).toBe(true)
      expect(input.attributes('max')).toBe('100')
      expect((input.element as HTMLInputElement).value).toBe('42')
    })

    it('updates position on change', async () => {
      const store = useReaderStore()
      store.document = {
        totalPages: 50,
        type: 'pdf',
        unitToPosition: (u: number) => ({ kind: 'pdf', page: u }),
      } as any
      store.currentPage = 10

      const storeGoToSpy = vi.spyOn(store, 'goToPosition')

      const wrapper = mount(ReaderProgressScrubber)
      const input = wrapper.find('input[type="range"]')
      await input.setValue('25')
      await input.trigger('change')

      expect(storeGoToSpy).toHaveBeenCalledWith({ kind: 'pdf', page: 25 })
    })

    it('updates position on pointerup or touchend when scrubbing', async () => {
      const store = useReaderStore()
      store.document = {
        totalPages: 50,
        type: 'pdf',
        unitToPosition: (u: number) => ({ kind: 'pdf', page: u }),
      } as any
      store.currentPage = 10

      const storeGoToSpy = vi.spyOn(store, 'goToPosition')

      const wrapper = mount(ReaderProgressScrubber)
      const input = wrapper.find('input[type="range"]')
      await input.trigger('pointerdown')
      await input.setValue('30')
      await input.trigger('pointerup')

      expect(storeGoToSpy).toHaveBeenCalledWith({ kind: 'pdf', page: 30 })

      storeGoToSpy.mockClear()
      await input.trigger('touchstart')
      await input.setValue('40')
      await input.trigger('touchend')

      expect(storeGoToSpy).toHaveBeenCalledWith({ kind: 'pdf', page: 40 })
    })
  })

  describe('ReaderTocDrawer', () => {
    it('renders toc items and emits navigation on click', async () => {
      const store = useReaderStore()
      store.document = {
        totalPages: 50,
        type: 'epub',
        getToc: async () => [
          { id: '1', label: 'Capítulo 1', depth: 0, position: { kind: 'epub', sectionIndex: 0, charOffset: 0 }, unit: 1 },
          { id: '2', label: 'Capítulo 2', depth: 0, position: { kind: 'epub', sectionIndex: 1, charOffset: 0 }, unit: 15 },
        ],
      } as any

      const storeGoToSpy = vi.spyOn(store, 'goToPosition')

      // Aguarda o watcher de getToc
      await new Promise((r) => setTimeout(r, 10))

      const wrapper = mount(ReaderTocDrawer, {
        props: {
          isOpen: true,
        },
        attachTo: document.body,
      })

      await new Promise((r) => setTimeout(r, 15))

      expect(document.body.textContent).toContain('Capítulo 1')
      expect(document.body.textContent).toContain('Capítulo 2')

      const buttons = Array.from(document.body.querySelectorAll('button'))
      const ch1Btn = buttons.find((b) => b.textContent?.includes('Capítulo 1'))
      expect(ch1Btn).toBeTruthy()
      ch1Btn?.click()

      expect(storeGoToSpy).toHaveBeenCalledWith({ kind: 'epub', sectionIndex: 0, charOffset: 0 })
      expect(wrapper.emitted('close')).toBeTruthy()
      wrapper.unmount()
    })

    it('does not render content when closed', () => {
      const wrapper = mount(ReaderTocDrawer, {
        props: {
          isOpen: false,
        },
        attachTo: document.body,
      })
      expect(document.body.querySelector('aside')).toBeNull()
      wrapper.unmount()
    })
  })

  describe('ReaderBackChip', () => {
    it('is not visible when showBackChip is false', () => {
      const nav = useReadingNavigation()
      nav.dismissBackChip()

      const wrapper = mount(ReaderBackChip)
      expect(wrapper.find('[role="button"]').exists()).toBe(false)
    })

    it('is visible when showBackChip is true and calls goBack on click', async () => {
      const store = useReaderStore()
      store.document = {
        totalPages: 50,
        type: 'pdf',
      } as any
      store.position = { kind: 'pdf', page: 20 }

      const nav = useReadingNavigation()
      nav.goToPosition({ kind: 'pdf', page: 35 })
      expect(nav.showBackChip.value).toBe(true)

      const storeGoToSpy = vi.spyOn(store, 'goToPosition')

      const wrapper = mount(ReaderBackChip)
      const btn = wrapper.find('[role="button"]')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toContain('Voltar')

      await btn.trigger('click')
      expect(storeGoToSpy).toHaveBeenCalledWith({ kind: 'pdf', page: 20 })
      expect(nav.showBackChip.value).toBe(false)
    })
  })

  describe('ReaderGoToField', () => {
    it('parses input and jumps on submit', async () => {
      const store = useReaderStore()
      store.document = {
        totalPages: 100,
        type: 'pdf',
        unitToPosition: (u: number) => ({ kind: 'pdf', page: u }),
      } as any

      const storeGoToSpy = vi.spyOn(store, 'goToPosition')

      const wrapper = mount(ReaderGoToField, {
        props: {
          isOpen: true,
        },
        attachTo: document.body,
      })

      const input = document.body.querySelector('input') as HTMLInputElement
      expect(input).toBeTruthy()
      input.value = '45'
      input.dispatchEvent(new Event('input'))

      const form = document.body.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit'))

      expect(storeGoToSpy).toHaveBeenCalledWith({ kind: 'pdf', page: 45 })
      expect(wrapper.emitted('close')).toBeTruthy()
      wrapper.unmount()
    })

    it('supports percentage jumping', async () => {
      const store = useReaderStore()
      store.document = {
        totalPages: 200,
        type: 'pdf',
        unitToPosition: (u: number) => ({ kind: 'pdf', page: u }),
      } as any

      const storeGoToSpy = vi.spyOn(store, 'goToPosition')

      const wrapper = mount(ReaderGoToField, {
        props: {
          isOpen: true,
        },
        attachTo: document.body,
      })

      const input = document.body.querySelector('input') as HTMLInputElement
      input.value = '50%'
      input.dispatchEvent(new Event('input'))

      const form = document.body.querySelector('form') as HTMLFormElement
      form.dispatchEvent(new Event('submit'))

      expect(storeGoToSpy).toHaveBeenCalledWith({ kind: 'pdf', page: 100 })
      wrapper.unmount()
    })
  })
})
