import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import OnboardingPage from '~/pages/onboarding.vue'
import * as authComposable from '~/composables/useAuth'

describe('Onboarding Carousel Page', () => {
  let updateProfileMock: any
  let completeOnboardingMock: any

  const commonStubs = {
    UserIcon: true,
    ShieldCheckIcon: true,
    CompassIcon: true,
    SparklesIcon: true,
    TargetIcon: true,
    CheckIcon: true,
    BrainIcon: true,
    LayersIcon: true,
    BookOpenIcon: true,
    NetworkIcon: true,
    ZapIcon: true,
    CloudIcon: true,
    FlameIcon: true,
    CheckCircle2Icon: true,
    SnowflakeIcon: true,
    ArrowRightIcon: true,
    ArrowLeftIcon: true
  }

  beforeEach(() => {
    updateProfileMock = vi.fn().mockResolvedValue({ success: true })
    completeOnboardingMock = vi.fn()

    vi.spyOn(authComposable, 'useAuth').mockReturnValue({
      token: ref('fake-token-123'),
      user: ref({ id: 42, name: 'Viktor Teste', email: 'viktor@aresta.app', role: 'USER', isActive: true }),
      isLoggedIn: ref(true),
      isAdmin: ref(false),
      updateProfile: updateProfileMock,
      completeOnboarding: completeOnboardingMock,
      isOnboardingCompleted: vi.fn().mockReturnValue(false)
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders Step 1 with display name input, 30 character limit counter and initial values', () => {
    const wrapper = mount(OnboardingPage, {
      global: {
        stubs: commonStubs
      }
    })

    expect(wrapper.text()).toContain('Como devemos chamar você no')
    expect(wrapper.text()).toContain('Sua Identidade Intelectual')
    expect(wrapper.text()).toContain('/ 30 caracteres')

    const input = wrapper.find('[data-testid="onboarding-display-name-input"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('maxlength')).toBe('30')
    expect(wrapper.find('.onboarding-page').classes()).toContain('bg-white')
  })

  it('navigates through carousel steps with Continuar and Voltar buttons', async () => {
    const wrapper = mount(OnboardingPage, {
      global: {
        stubs: commonStubs
      }
    })

    // Passo 1 -> Passo 2
    expect(wrapper.text()).toContain('1 / 5')
    const nextBtn = wrapper.find('[data-testid="onboarding-next-btn"]')
    await nextBtn.trigger('click')

    // Passo 2: Intenção & Objetivos
    expect(wrapper.text()).toContain('O que trouxe você ao')
    expect(wrapper.text()).toContain('Sua Intenção & Objetivos')

    // Passo 2 -> Passo 3
    await nextBtn.trigger('click')
    expect(wrapper.text()).toContain('resistência cognitiva')
    expect(wrapper.text()).toContain('Neurociência da Leitura Ativa')

    // Passo 3 -> Passo 4
    await nextBtn.trigger('click')
    expect(wrapper.text()).toContain('O Ecossistema Aresta')
    expect(wrapper.text()).toContain('Leitor Universal 3D')

    // Passo 4 -> Passo 5
    await nextBtn.trigger('click')
    expect(wrapper.text()).toContain('Como funciona a Ofensiva e sua meta')
    expect(wrapper.text()).toContain('O que é a Chama')
    expect(wrapper.text()).toContain('Como Pontuar no Dia')

    // Botão Voltar funciona
    const prevBtn = wrapper.find('[data-testid="onboarding-prev-btn"]')
    expect(prevBtn.exists()).toBe(true)
    await prevBtn.trigger('click')
    expect(wrapper.text()).toContain('O Ecossistema Aresta')
  })

  it('allows selecting streak target and finishing onboarding in Step 5', async () => {
    const wrapper = mount(OnboardingPage, {
      global: {
        stubs: commonStubs
      }
    })

    // Avança até o passo 5
    for (let i = 0; i < 4; i++) {
      await wrapper.find('[data-testid="onboarding-next-btn"]').trigger('click')
    }

    // Seleciona meta de 5 dias
    const target5Btn = wrapper.find('[data-testid="target-streak-5"]')
    expect(target5Btn.exists()).toBe(true)
    await target5Btn.trigger('click')

    // Botão finalizar
    const finishBtn = wrapper.find('[data-testid="onboarding-finish-btn"]')
    expect(finishBtn.exists()).toBe(true)

    const navigateToMock = vi.fn()
    ;(globalThis as any).navigateTo = navigateToMock

    await finishBtn.trigger('click')

    expect(completeOnboardingMock).toHaveBeenCalledWith(42)
    expect(navigateToMock).toHaveBeenCalledWith('/library', { replace: true })
  })
})
