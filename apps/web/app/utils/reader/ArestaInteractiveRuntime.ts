/**
 * ArestaInteractiveRuntime
 *
 * Runtime seguro para componentes interativos do Aresta dentro da camada DOM do leitor:
 * - Flashcards 3D com efeito flip e salvamento direto no Deck da aplicação.
 * - Steppers (Passo a Passo) com navegação interativa de etapas.
 * - Subtemas com botões de ação rápida ('Explicar' e 'Criar Livreto').
 */

export interface InteractiveRuntimeOptions {
  bookId?: number
  bookTitle?: string
  pageNumber?: number
  onAddFlashcard?: (card: { question: string; answer: string; cardType?: string; difficulty?: number }) => Promise<boolean>
  onExplainSubtopic?: (topic: string) => void
  onCreateSubtopicBooklet?: (topic: string) => void
}

export class ArestaInteractiveRuntime {
  static mount(container: HTMLElement, options: InteractiveRuntimeOptions = {}): () => void {
    if (!container) return () => {}

    const cleanupFns: Array<() => void> = []

    // 1. Inicializar Flashcards Interativos
    const flashcards = container.querySelectorAll<HTMLElement>('.aresta-flashcard')
    flashcards.forEach((card) => {
      // Toggle de Flip ao clicar no corpo do card (exceto no botão de salvar)
      const handleCardClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (target.closest('.aresta-btn-add-deck') || target.tagName.toLowerCase() === 'button') {
          return
        }
        card.classList.toggle('is-flipped')
      }

      card.addEventListener('click', handleCardClick)
      cleanupFns.push(() => card.removeEventListener('click', handleCardClick))

      // Botão Adicionar ao Deck
      const addBtn = card.querySelector<HTMLButtonElement>('.aresta-btn-add-deck')
      if (addBtn) {
        const handleAddClick = async (e: MouseEvent) => {
          e.stopPropagation()
          if (addBtn.disabled || addBtn.classList.contains('is-saved')) return

          const question = card.dataset.question || card.querySelector('.aresta-card-q')?.textContent?.trim() || ''
          const answer = card.dataset.answer || card.querySelector('.aresta-card-a')?.textContent?.trim() || ''
          const cardType = card.dataset.type || 'CONCEPT_RECALL'
          const difficulty = parseFloat(card.dataset.difficulty || '2.5')

          addBtn.disabled = true
          addBtn.textContent = 'Salvando...'

          try {
            let success = false
            if (options.onAddFlashcard) {
              success = await options.onAddFlashcard({ question, answer, cardType, difficulty })
            } else {
              // Dispara evento global para o composable useFlashcards
              const event = new CustomEvent('aresta:add-flashcard', {
                bubbles: true,
                cancelable: true,
                detail: { question, answer, cardType, difficulty, bookId: options.bookId },
              })
              window.dispatchEvent(event)
              success = true
            }

            if (success) {
              addBtn.classList.add('is-saved')
              addBtn.textContent = 'Salvo no seu Deck'
            } else {
              addBtn.disabled = false
              addBtn.textContent = 'Tentar novamente'
            }
          } catch (err) {
            console.error('[ArestaInteractiveRuntime] Erro ao adicionar flashcard:', err)
            addBtn.disabled = false
            addBtn.textContent = 'Erro ao salvar'
          }
        }

        addBtn.addEventListener('click', handleAddClick)
        cleanupFns.push(() => addBtn.removeEventListener('click', handleAddClick))
      }
    })

    // 2. Inicializar Steppers Interativos (Passo a Passo)
    const steppers = container.querySelectorAll<HTMLElement>('.aresta-stepper')
    steppers.forEach((stepper) => {
      const steps = Array.from(stepper.querySelectorAll<HTMLElement>('.aresta-step'))
      if (steps.length <= 1) return

      let currentStepIndex = 0

      // Injeta cabeçalho visual e dots se ainda não existirem
      let dotsContainer = stepper.querySelector<HTMLElement>('.aresta-stepper-dots')
      if (!stepper.querySelector('.aresta-stepper-header')) {
        const titleText = stepper.dataset.title || 'Demonstração Interativa'
        const header = document.createElement('div')
        header.className = 'aresta-stepper-header'

        let dotsHtml = ''
        for (let i = 0; i < steps.length; i++) {
          dotsHtml += `<button type="button" class="aresta-stepper-dot${i === 0 ? ' is-active' : ''}" data-step-index="${i}" aria-label="Ir para etapa ${i + 1}"></button>`
        }

        header.innerHTML = `
          <div class="aresta-stepper-title-wrap">
            <span class="aresta-stepper-pill">
              <span class="aresta-stepper-pulse"></span>
              <span class="aresta-stepper-title-text">${titleText}</span>
            </span>
          </div>
          <div class="aresta-stepper-dots">${dotsHtml}</div>
        `
        stepper.insertBefore(header, stepper.firstChild)
        dotsContainer = header.querySelector<HTMLElement>('.aresta-stepper-dots')
      }

      // Injeta barra de progresso visual
      let progressFill = stepper.querySelector<HTMLElement>('.aresta-stepper-progress-fill')
      if (!stepper.querySelector('.aresta-stepper-progress-track')) {
        const track = document.createElement('div')
        track.className = 'aresta-stepper-progress-track'
        track.innerHTML = `<div class="aresta-stepper-progress-fill" style="width: ${(1 / steps.length) * 100}%"></div>`
        const header = stepper.querySelector('.aresta-stepper-header')
        if (header && header.nextSibling) {
          stepper.insertBefore(track, header.nextSibling)
        } else {
          stepper.insertBefore(track, stepper.firstChild)
        }
        progressFill = track.querySelector<HTMLElement>('.aresta-stepper-progress-fill')
      }

      const updateStepsVisibility = () => {
        steps.forEach((step, idx) => {
          if (idx === currentStepIndex) {
            step.classList.add('is-active')
            step.style.display = 'block'
          } else {
            step.classList.remove('is-active')
            step.style.display = 'none'
          }
        })

        if (progressFill) {
          progressFill.style.width = `${((currentStepIndex + 1) / steps.length) * 100}%`
        }

        if (dotsContainer) {
          const dots = dotsContainer.querySelectorAll('.aresta-stepper-dot')
          dots.forEach((dot, idx) => {
            if (idx === currentStepIndex) {
              dot.classList.add('is-active')
              dot.classList.add('is-current')
            } else if (idx < currentStepIndex) {
              dot.classList.add('is-active')
              dot.classList.remove('is-current')
            } else {
              dot.classList.remove('is-active')
              dot.classList.remove('is-current')
            }
          })
        }

        const indicator = stepper.querySelector<HTMLElement>('.aresta-stepper-indicator')
        if (indicator) {
          indicator.textContent = `Etapa ${currentStepIndex + 1} de ${steps.length}`
        }

        const prevBtn = stepper.querySelector<HTMLButtonElement>('.aresta-stepper-btn.prev')
        const nextBtn = stepper.querySelector<HTMLButtonElement>('.aresta-stepper-btn.next')
        if (prevBtn) prevBtn.disabled = currentStepIndex === 0
        if (nextBtn) nextBtn.disabled = currentStepIndex === steps.length - 1
      }

      // Se os controles ainda não existirem no HTML da IA, injeta controles limpos
      if (!stepper.querySelector('.aresta-stepper-controls')) {
        const controls = document.createElement('div')
        controls.className = 'aresta-stepper-controls'
        controls.innerHTML = `
          <button type="button" class="aresta-stepper-btn prev" aria-label="Etapa anterior">Anterior</button>
          <span class="aresta-stepper-indicator">Etapa 1 de ${steps.length}</span>
          <button type="button" class="aresta-stepper-btn next" aria-label="Próxima etapa">Próximo</button>
        `
        stepper.appendChild(controls)
      }

      const prevBtn = stepper.querySelector<HTMLButtonElement>('.aresta-stepper-btn.prev')
      const nextBtn = stepper.querySelector<HTMLButtonElement>('.aresta-stepper-btn.next')

      const handlePrev = (e: MouseEvent) => {
        e.stopPropagation()
        if (currentStepIndex > 0) {
          currentStepIndex--
          updateStepsVisibility()
        }
      }

      const handleNext = (e: MouseEvent) => {
        e.stopPropagation()
        if (currentStepIndex < steps.length - 1) {
          currentStepIndex++
          updateStepsVisibility()
        }
      }

      prevBtn?.addEventListener('click', handlePrev)
      nextBtn?.addEventListener('click', handleNext)
      if (prevBtn) cleanupFns.push(() => prevBtn.removeEventListener('click', handlePrev))
      if (nextBtn) cleanupFns.push(() => nextBtn.removeEventListener('click', handleNext))

      if (dotsContainer) {
        const handleDotsClick = (e: MouseEvent) => {
          const target = (e.target as HTMLElement).closest<HTMLElement>('.aresta-stepper-dot')
          if (target && target.dataset.stepIndex !== undefined) {
            e.stopPropagation()
            currentStepIndex = parseInt(target.dataset.stepIndex, 10)
            updateStepsVisibility()
          }
        }
        dotsContainer.addEventListener('click', handleDotsClick)
        cleanupFns.push(() => dotsContainer?.removeEventListener('click', handleDotsClick))
      }

      // Inicia exibição no primeiro passo
      updateStepsVisibility()
    })

    // 3. Inicializar Ações de Subtemas
    const subtopics = container.querySelectorAll<HTMLElement>('.aresta-subtopic')
    subtopics.forEach((subtopic) => {
      const topicName = subtopic.dataset.topic || subtopic.querySelector('.aresta-subtopic-title')?.textContent?.trim() || ''

      const explainBtn = subtopic.querySelector<HTMLButtonElement>('.aresta-btn-explain')
      const bookletBtn = subtopic.querySelector<HTMLButtonElement>('.aresta-btn-booklet')

      if (explainBtn) {
        const handleExplain = (e: MouseEvent) => {
          e.stopPropagation()
          if (options.onExplainSubtopic) {
            options.onExplainSubtopic(topicName)
          } else {
            window.dispatchEvent(new CustomEvent('aresta:explain-subtopic', {
              bubbles: true,
              detail: { topic: topicName, bookId: options.bookId },
            }))
          }
        }
        explainBtn.addEventListener('click', handleExplain)
        cleanupFns.push(() => explainBtn.removeEventListener('click', handleExplain))
      }

      if (bookletBtn) {
        const handleBooklet = (e: MouseEvent) => {
          e.stopPropagation()
          if (options.onCreateSubtopicBooklet) {
            options.onCreateSubtopicBooklet(topicName)
          } else {
            window.dispatchEvent(new CustomEvent('aresta:create-subtopic-booklet', {
              bubbles: true,
              detail: { topic: topicName, parentBookId: options.bookId },
            }))
          }
        }
        bookletBtn.addEventListener('click', handleBooklet)
        cleanupFns.push(() => bookletBtn.removeEventListener('click', handleBooklet))
      }
    })

    return () => {
      cleanupFns.forEach((fn) => fn())
    }
  }
}
