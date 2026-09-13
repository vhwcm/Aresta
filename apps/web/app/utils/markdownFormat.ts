import { marked } from 'marked';

export interface MarkdownFormatResult {
  newText: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Escapa caracteres HTML inseguros para mitigar vulnerabilidades XSS ao renderizar HTML dinâmico.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Renderiza markdown inline (negrito, itálico, código, links) de forma segura sem envolver em tag <p>.
 */
export function renderInlineMarkdown(text: string | null | undefined): string {
  if (!text) return '';
  const safe = escapeHtml(text);
  const parsed = marked.parseInline(safe, { gfm: true, breaks: true });
  return typeof parsed === 'string' ? parsed : text;
}

/**
 * Renderiza markdown completo com quebras de linha e blocos de forma segura.
 */
export function renderMarkdown(text: string | null | undefined): string {
  if (!text) return '';
  const safe = escapeHtml(text);
  const parsed = marked.parse(safe, { gfm: true, breaks: true });
  return typeof parsed === 'string' ? parsed : text;
}

/**
 * Aplica ou desfaz formatação Markdown (negrito ou itálico) em um elemento textarea ou texto com posições.
 */
export function applyMarkdownFormat(
  value: string,
  start: number,
  end: number,
  format: 'bold' | 'italic'
): MarkdownFormatResult {
  const marker = format === 'bold' ? '**' : '*';
  const markerLen = marker.length;

  if (start !== end) {
    const selectedText = value.slice(start, end);

    // 1. Checa se o texto selecionado já contém a formatação internamente
    const isWrappedInSelection =
      format === 'bold'
        ? selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4
        : selectedText.startsWith('*') &&
          selectedText.endsWith('*') &&
          !selectedText.startsWith('**') &&
          !selectedText.endsWith('**') &&
          selectedText.length >= 2;

    if (isWrappedInSelection) {
      // Remove marcadores da seleção
      const unwrapped = selectedText.slice(markerLen, selectedText.length - markerLen);
      const newText = value.slice(0, start) + unwrapped + value.slice(end);
      return {
        newText,
        selectionStart: start,
        selectionEnd: start + unwrapped.length,
      };
    }

    // 2. Checa se o texto fora da seleção já está envolvido pelo marcador
    const hasMarkerAround =
      format === 'bold'
        ? start >= 2 &&
          end + 2 <= value.length &&
          value.slice(start - 2, start) === '**' &&
          value.slice(end, end + 2) === '**'
        : start >= 1 &&
          end + 1 <= value.length &&
          value.slice(start - 1, start) === '*' &&
          value.slice(end, end + 1) === '*' &&
          !(start >= 2 && value.slice(start - 2, start) === '**') &&
          !(end + 2 <= value.length && value.slice(end, end + 2) === '**');

    if (hasMarkerAround) {
      // Remove marcadores que envolvem a seleção
      const newText = value.slice(0, start - markerLen) + selectedText + value.slice(end + markerLen);
      return {
        newText,
        selectionStart: start - markerLen,
        selectionEnd: end - markerLen,
      };
    }

    // 3. Aplica o marcador ao redor da seleção
    const newText = value.slice(0, start) + marker + selectedText + marker + value.slice(end);
    return {
      newText,
      selectionStart: start + markerLen,
      selectionEnd: end + markerLen,
    };
  }

  // Sem texto selecionado (cursor simples)
  // Checa se o cursor está dentro de marcadores vazios (ex: **|** ou *|*)
  const isInsideEmptyMarker =
    format === 'bold'
      ? start >= 2 &&
        start + 2 <= value.length &&
        value.slice(start - 2, start) === '**' &&
        value.slice(start, start + 2) === '**'
      : start >= 1 &&
        start + 1 <= value.length &&
        value.slice(start - 1, start) === '*' &&
        value.slice(start, start + 1) === '*' &&
        !(start >= 2 && value.slice(start - 2, start) === '**') &&
        !(start + 2 <= value.length && value.slice(start, start + 2) === '**');

  if (isInsideEmptyMarker) {
    // Remove o marcador vazio
    const newText = value.slice(0, start - markerLen) + value.slice(start + markerLen);
    return {
      newText,
      selectionStart: start - markerLen,
      selectionEnd: start - markerLen,
    };
  }

  // Insere novo marcador vazio e coloca o cursor no meio
  const newText = value.slice(0, start) + marker + marker + value.slice(start);
  return {
    newText,
    selectionStart: start + markerLen,
    selectionEnd: start + markerLen,
  };
}
