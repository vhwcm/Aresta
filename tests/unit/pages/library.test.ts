import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LibraryPage from '../../../app/pages/library.vue'

describe('Library Page', () => {
  it('renders the library page with default recommendations tab', () => {
    const wrapper = mount(LibraryPage)
    expect(wrapper.text()).toContain('Sua Biblioteca')
    expect(wrapper.text()).toContain('Curadoria da IA')
  })

  it('switches to My Books tab when clicked', async () => {
    const wrapper = mount(LibraryPage)
    
    // Find the My Books button
    const buttons = wrapper.findAll('button')
    const myBooksButton = buttons.find(b => b.text().includes('Meus Livros'))
    
    expect(myBooksButton).toBeDefined()
    await myBooksButton!.trigger('click')
    
    expect(wrapper.text()).toContain('Sua Estante')
    expect(wrapper.text()).toContain('Concluídos este ano')
  })
})
