import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConversorPage from '~/pages/conversor.vue'

describe('Conversor Page (/conversor)', () => {
  const defaultStubs = {
    NuxtLink: { template: '<a><slot /></a>' },
    FileCode2Icon: true,
    UploadCloudIcon: true,
    FileTextIcon: true,
    SlidersIcon: true,
    RefreshCwIcon: true,
    CheckCircle2Icon: true,
    DownloadIcon: true,
    BookOpenIcon: true,
    AlertCircleIcon: true,
    AlertTriangleIcon: true,
    RotateCcwIcon: true
  }

  it('renders page title and upload dropzone correctly', () => {
    const wrapper = mount(ConversorPage, {
      global: {
        stubs: defaultStubs
      }
    })

    expect(wrapper.text()).toContain('Conversor de PDF para EPUB')
    expect(wrapper.text()).toContain('Clique ou arraste seu arquivo PDF aqui')
  })
})

