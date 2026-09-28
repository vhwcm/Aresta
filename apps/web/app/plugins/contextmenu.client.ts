export function handleContextMenu(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  // Permite menu nativo do navegador apenas dentro de campos de entrada/edição de texto
  const isEditable = target?.closest?.('input, textarea, [contenteditable="true"]')
  if (!isEditable) {
    event.preventDefault()
  }
}

export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  window.addEventListener('contextmenu', handleContextMenu, { capture: true })
})
