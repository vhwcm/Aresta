import { isProductionMode } from './logger'

export type ProfilerCategory = 'network' | 'io' | 'parse' | 'render' | 'layout' | 'store' | 'webgl' | 'general'

export interface ProfileStep {
  name: string
  category: ProfilerCategory
  startTime: number
  endTime: number | null
  durationMs: number | null
  percentage: number | null
  details?: Record<string, any>
}

export interface ProfileReport {
  sessionId: string
  sessionName: string
  startedAt: string
  totalDurationMs: number
  metadata: Record<string, any>
  steps: ProfileStep[]
  bottlenecks: {
    name: string
    category: ProfilerCategory
    durationMs: number
    percentage: number
    recommendation?: string
  }[]
}

class ReaderProfiler {
  private _activeSession: {
    id: string
    name: string
    startTime: number
    metadata: Record<string, any>
    steps: ProfileStep[]
    openSteps: Map<string, number>
  } | null = null

  private _lastReport: ProfileReport | null = null
  private _isEnabled: boolean | null = null

  public isEnabled(): boolean {
    if (this._isEnabled !== null) return this._isEnabled
    if (typeof window !== 'undefined') {
      const explicit = localStorage.getItem('aresta_debug_profiler')
      if (explicit === 'true') return true
      if (explicit === 'false') return false
    }
    return !isProductionMode()
  }

  public setEnabled(enabled: boolean): void {
    this._isEnabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('aresta_debug_profiler', enabled ? 'true' : 'false')
    }
  }

  public startSession(name: string, metadata: Record<string, any> = {}): void {
    if (!this.isEnabled()) return

    const now = performance.now()
    this._activeSession = {
      id: `prof_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      startTime: now,
      metadata,
      steps: [],
      openSteps: new Map(),
    }
  }

  public startStep(stepName: string, category: ProfilerCategory = 'general'): void {
    if (!this._activeSession) return
    const now = performance.now()
    this._activeSession.openSteps.set(stepName, now)

    const existingIndex = this._activeSession.steps.findIndex((s) => s.name === stepName)
    const existingStep = existingIndex >= 0 ? this._activeSession.steps[existingIndex] : null
    if (existingStep) {
      existingStep.startTime = now
      existingStep.endTime = null
      existingStep.durationMs = null
    } else {
      this._activeSession.steps.push({
        name: stepName,
        category,
        startTime: now,
        endTime: null,
        durationMs: null,
        percentage: null,
      })
    }
  }

  public endStep(stepName: string, details?: Record<string, any>): void {
    if (!this._activeSession) return
    const now = performance.now()
    const startTime = this._activeSession.openSteps.get(stepName) ?? this._activeSession.startTime
    this._activeSession.openSteps.delete(stepName)

    const durationMs = Math.round((now - startTime) * 100) / 100
    const step = this._activeSession.steps.find((s) => s.name === stepName)
    if (step) {
      step.endTime = now
      step.durationMs = durationMs
      if (details) {
        step.details = { ...step.details, ...details }
      }
    } else {
      this._activeSession.steps.push({
        name: stepName,
        category: 'general',
        startTime,
        endTime: now,
        durationMs,
        percentage: null,
        details,
      })
    }
  }

  public async measureAsync<T>(
    stepName: string,
    fn: () => Promise<T>,
    category: ProfilerCategory = 'general',
    details?: Record<string, any>,
  ): Promise<T> {
    if (!this._activeSession) {
      return fn()
    }
    this.startStep(stepName, category)
    try {
      const result = await fn()
      this.endStep(stepName, details)
      return result
    } catch (err: any) {
      this.endStep(stepName, { error: err?.message || String(err), ...details })
      throw err
    }
  }

  public measureSync<T>(
    stepName: string,
    fn: () => T,
    category: ProfilerCategory = 'general',
    details?: Record<string, any>,
  ): T {
    if (!this._activeSession) {
      return fn()
    }
    this.startStep(stepName, category)
    try {
      const result = fn()
      this.endStep(stepName, details)
      return result
    } catch (err: any) {
      this.endStep(stepName, { error: err?.message || String(err), ...details })
      throw err
    }
  }

  public endSession(): ProfileReport | null {
    if (!this._activeSession) return null
    const endTotal = performance.now()
    const totalDuration = Math.round((endTotal - this._activeSession.startTime) * 100) / 100

    // Fechar passos que ainda estavam abertos
    for (const [openName, startTime] of this._activeSession.openSteps) {
      const durationMs = Math.round((endTotal - startTime) * 100) / 100
      const step = this._activeSession.steps.find((s) => s.name === openName)
      if (step) {
        step.endTime = endTotal
        step.durationMs = durationMs
      }
    }
    this._activeSession.openSteps.clear()

    const stepsWithPercentage = this._activeSession.steps.map((step) => {
      const dur = step.durationMs ?? 0
      const pct = totalDuration > 0 ? Math.round((dur / totalDuration) * 1000) / 10 : 0
      return {
        ...step,
        durationMs: dur,
        percentage: pct,
      }
    })

    // Identificar gargalos (etapas > 20% do tempo total ou > 400ms)
    const bottlenecks = stepsWithPercentage
      .filter((s) => (s.percentage ?? 0) >= 20 || (s.durationMs ?? 0) > 400)
      .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
      .map((b) => ({
        name: b.name,
        category: b.category,
        durationMs: b.durationMs ?? 0,
        percentage: b.percentage ?? 0,
        recommendation: this._getRecommendation(b.name, b.category, b.durationMs ?? 0),
      }))

    const report: ProfileReport = {
      sessionId: this._activeSession.id,
      sessionName: this._activeSession.name,
      startedAt: new Date().toISOString(),
      totalDurationMs: totalDuration,
      metadata: this._activeSession.metadata,
      steps: stepsWithPercentage,
      bottlenecks,
    }

    this._lastReport = report
    this._activeSession = null

    if (typeof window !== 'undefined') {
      (window as any).__ARESTA_READER_PROFILE__ = report
      try {
        window.dispatchEvent(new CustomEvent('aresta:reader-profile', { detail: report }))
      } catch {
        /* ignorar */
      }
    }

    this._printReport(report)
    return report
  }

  public getLastReport(): ProfileReport | null {
    return this._lastReport
  }

  private _getRecommendation(name: string, category: ProfilerCategory, durationMs: number): string {
    if (category === 'network') {
      return `Download demorou ${durationMs}ms. Considere pré-carregamento (prefetch), compressão brotli/gzip ou cache HTTP/IndexedDB.`
    }
    if (name.includes('fflate') || name.includes('Unzip')) {
      return `Descompactação do EPUB levou ${durationMs}ms. Considere streaming de seções ou web worker para unzip.`
    }
    if (name.includes('pdfjs') || name.includes('PDF')) {
      return `Processamento do PDF levou ${durationMs}ms. Otimize com inicialização antecipada do Web Worker.`
    }
    if (category === 'render' || category === 'webgl') {
      return `Renderização inicial levou ${durationMs}ms. Reduza a escala da 1ª página ou priorize canvas 2D na inicialização.`
    }
    return `Tempo elevado de execução (${durationMs}ms). Avalie dividir em microtarefas ou paralelizar.`
  }

  private _printReport(report: ProfileReport): void {
    if (typeof console === 'undefined') return

    const headerStyle = 'color: #a78bfa; font-weight: bold; font-size: 13px;'
    const warnStyle = 'color: #fbbf24; font-weight: bold;'
    const dangerStyle = 'color: #f87171; font-weight: bold;'
    const totalColor = report.totalDurationMs > 1500 ? dangerStyle : (report.totalDurationMs > 700 ? warnStyle : 'color: #4ade80; font-weight: bold;')

    console.groupCollapsed(`%c⚡ [Aresta Reader Profiler] ${report.sessionName} — Total: ${report.totalDurationMs}ms`, headerStyle)

    console.log(`%cTempo Total até a 1ª Página: %c${report.totalDurationMs}ms`, 'color: #9ca3af', totalColor)
    if (Object.keys(report.metadata).length > 0) {
      console.log('%cMetadados:', 'color: #9ca3af', report.metadata)
    }

    const tableData = report.steps.map((s) => ({
      'Etapa / Função': s.name,
      'Categoria': s.category.toUpperCase(),
      'Duração (ms)': s.durationMs,
      '% do Total': `${s.percentage}%`,
      'Detalhes': s.details ? JSON.stringify(s.details) : '-',
    }))

    console.table(tableData)

    if (report.bottlenecks.length > 0) {
      console.warn(`%c⚠️ Gargalos Identificados (${report.bottlenecks.length}):`, 'font-weight: bold;')
      report.bottlenecks.forEach((b, idx) => {
        console.warn(
          `  ${idx + 1}. [${b.category.toUpperCase()}] ${b.name}: ${b.durationMs}ms (${b.percentage}% do tempo total)\n     💡 Sugestão: ${b.recommendation || '-'}`,
        )
      })
    } else {
      console.log('%c✅ Nenhum gargalo crítico detectado (< 20% e < 400ms por etapa).', 'color: #4ade80')
    }

    console.log(
      '%cPara inspecionar o relatório completo via console, use: %cwindow.__ARESTA_READER_PROFILE__',
      'color: #9ca3af; font-size: 11px;',
      'color: #38bdf8; font-family: monospace; font-size: 11px;',
    )

    console.groupEnd()
  }
}

export const readerProfiler = new ReaderProfiler()

