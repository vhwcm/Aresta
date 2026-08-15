import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UploadPage from '../../../app/pages/upload.vue'

describe('Upload Page', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders the upload page title and dropzone container', () => {
    const wrapper = mount(UploadPage, {
      global: {
        stubs: {
          NuxtLink: true,
          ReaderUploadDropZone: true
        }
      }
    })
    expect(wrapper.text()).toContain('Upload de Livros')
    expect(wrapper.text()).toContain('Módulo de Importação')
    expect(wrapper.text()).toContain('Formatos Suportados')
  })
})
