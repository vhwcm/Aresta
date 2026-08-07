import { ref } from 'vue'
import { validateBookFile } from '~/utils/fileValidator'
import type { IValidationResult } from '~/interfaces/reader/IValidationResult'

const ACCEPTED_EXTENSIONS = ['.pdf', '.epub']

export function useFileValidator() {
  const validationResult = ref<IValidationResult | null>(null)
  const isValidating = ref(false)

  async function validate(file: File): Promise<IValidationResult> {
    isValidating.value = true
    validationResult.value = null

    try {
      const result = await validateBookFile(file)
      validationResult.value = result
      return result
    } finally {
      isValidating.value = false
    }
  }

  function reset() {
    validationResult.value = null
    isValidating.value = false
  }

  return {
    validationResult,
    isValidating,
    validate,
    reset,
    acceptedExtensions: ACCEPTED_EXTENSIONS,
  }
}
