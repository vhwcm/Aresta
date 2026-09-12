import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSelect from '~/components/AppSelect.vue'

describe('AppSelect.vue', () => {
  const options = [
    { value: 'all', label: 'Todas as Obras', count: 28 },
    { value: '1', label: 'Rei Artur' },
    { value: '2', label: 'Contos Fluminenses' },
    { value: '3', label: 'A Estrutura das Revoluções Científicas' }
  ]

  it('renders trigger with selected option label', () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'all',
        options
      }
    })

    expect(wrapper.find('[data-testid="app-select-trigger"]').text()).toContain('Todas as Obras')
    expect(wrapper.find('[data-testid="app-select-dropdown"]').exists()).toBe(false)
  })

  it('opens dropdown when trigger is clicked', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'all',
        options
      }
    })

    await wrapper.find('[data-testid="app-select-trigger"]').trigger('click')
    expect(wrapper.find('[data-testid="app-select-dropdown"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid^="app-select-option-"]')).toHaveLength(4)
  })

  it('emits update:modelValue and change when an option is selected', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'all',
        options
      }
    })

    await wrapper.find('[data-testid="app-select-trigger"]').trigger('click')
    const option = wrapper.find('[data-testid="app-select-option-2"]')
    expect(option.exists()).toBe(true)
    await option.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['2'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['2'])
    expect(wrapper.find('[data-testid="app-select-dropdown"]').exists()).toBe(false)
  })

  it('filters options when typing in search input', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'all',
        options,
        searchable: true
      }
    })

    await wrapper.find('[data-testid="app-select-trigger"]').trigger('click')
    const searchInput = wrapper.find('[data-testid="app-select-search-input"]')
    expect(searchInput.exists()).toBe(true)

    await searchInput.setValue('Artur')
    const filteredOptions = wrapper.findAll('[data-testid^="app-select-option-"]')
    expect(filteredOptions).toHaveLength(1)
    expect(filteredOptions[0]?.text()).toContain('Rei Artur')
  })

  it('closes dropdown when pressing Escape', async () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: 'all',
        options
      }
    })

    await wrapper.find('[data-testid="app-select-trigger"]').trigger('click')
    expect(wrapper.find('[data-testid="app-select-dropdown"]').exists()).toBe(true)

    await wrapper.find('[data-testid="app-select-trigger"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[data-testid="app-select-dropdown"]').exists()).toBe(false)
  })

  it('renders placeholder when no value is selected', () => {
    const wrapper = mount(AppSelect, {
      props: {
        modelValue: null,
        options,
        placeholder: 'Selecione um item'
      }
    })

    expect(wrapper.find('[data-testid="app-select-trigger"]').text()).toContain('Selecione um item')
  })
})
