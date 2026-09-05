<template>
  <div class="reader-uploader">
    <div class="reader-uploader__inner">
      <div class="reader-uploader__header">
        <NuxtLink to="/" class="reader-uploader__back">
          ← Voltar
        </NuxtLink>
        <h1 class="reader-uploader__title">Aresta</h1>
      </div>
      <ReaderUploadDropZone
        id="reader-drop-zone"
        @file-validated="onFileValidated"
      />
      <p v-if="store.error" class="reader-uploader__error" role="alert">
        {{ store.error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useReaderStore } from '~/stores/readerStore'
import { useLocalBookUpload } from '~/composables/useLocalBookUpload'
import { isProductionMode, logError } from '~/utils/logger'
import type { SupportedFileType } from '~/interfaces/reader/IValidationResult'

const store = useReaderStore()
const { uploadBookLocally } = useLocalBookUpload()

async function onFileValidated({ file, type }: { file: File; type: SupportedFileType }) {
  store.setLoading(true)

  try {
    store.syncSettings()
    const result = await uploadBookLocally({
      file,
      type,
      initialFontSize: store.fontSize,
      initialFontFamily: store.fontFamily,
    })
    store.setDocument(result.doc, result.title, result.bookId)
  } catch (error) {
    logError('[Uploader Error]', error)
    const isProd = isProductionMode()
    const msg = isProd
      ? 'Falha ao abrir o arquivo.'
      : `Falha ao abrir o arquivo: ${String(error)}`
    store.setError(msg)
  } finally {
    store.setLoading(false)
  }
}
</script>

<style scoped>
.reader-uploader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: 2rem;
  width: 100%;
}

.reader-uploader__inner {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.reader-uploader__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reader-uploader__back {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.reader-uploader__back:hover {
  color: var(--color-text-primary);
}

.reader-uploader__title {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #7c6af7, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.reader-uploader__error {
  color: var(--color-error);
  font-size: 0.875rem;
  text-align: center;
  padding: 0.75rem 1rem;
  background: rgba(247, 106, 106, 0.08);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(247, 106, 106, 0.2);
}
</style>
