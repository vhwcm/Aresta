export function isProductionMode(): boolean {
  if (typeof process !== 'undefined' && process.env && process.env.IS_PRODUCTION !== undefined) {
    return process.env.IS_PRODUCTION === 'true'
  }
  try {
    const config = useRuntimeConfig()
    return Boolean(config.public?.isProduction || config.isProduction)
  } catch {
    return false
  }
}

export function logError(...args: any[]): void {
  if (!isProductionMode()) {
    console.error(...args)
  }
}

export function logWarn(...args: any[]): void {
  if (!isProductionMode()) {
    console.warn(...args)
  }
}

export function formatErrorMessage(error: any, fallbackMessage: string = 'Ocorreu um erro no sistema'): string {
  if (isProductionMode()) {
    return fallbackMessage
  }
  if (typeof error === 'string') return error
  return error?.message || String(error || fallbackMessage)
}
