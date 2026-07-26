import { test, expect } from '@playwright/test'

test.describe('Fluxo de Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reader')
  })

  test('exibe a drop zone na página /reader', async ({ page }) => {
    await expect(page.locator('#drop-zone-area')).toBeVisible()
  })

  test('rejeita arquivo de texto renomeado como .pdf', async ({ page }) => {
    const dropZone = page.locator('#drop-zone-area')
    await expect(dropZone).toBeVisible()

    const fakeBuffer = Buffer.from('Este é um arquivo de texto, não um PDF!')
    await page.locator('#file-input-hidden').setInputFiles({
      name: 'fake.pdf',
      mimeType: 'application/pdf',
      buffer: fakeBuffer,
    })

    await expect(page.locator('#drop-zone-error')).toBeVisible()
    await expect(page.locator('#drop-zone-error')).toContainText('assinatura de bytes inválida')
  })

  test('aceita PDF válido e exibe o leitor', async ({ page }) => {
    const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
    const minimalPdfContent = Buffer.concat([
      pdfMagic,
      Buffer.from('\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'),
    ])

    await page.locator('#file-input-hidden').setInputFiles({
      name: 'valido.pdf',
      mimeType: 'application/pdf',
      buffer: minimalPdfContent,
    })

    await expect(page.locator('#book-stage')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#reader-header')).toBeVisible()
  })

  test('botão Fechar retorna para a tela de upload', async ({ page }) => {
    const pdfMagic = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34])
    await page.locator('#file-input-hidden').setInputFiles({
      name: 'valido.pdf',
      mimeType: 'application/pdf',
      buffer: pdfMagic,
    })

    await page.locator('#btn-close-book').click()
    await expect(page.locator('#drop-zone-area')).toBeVisible()
  })
})
