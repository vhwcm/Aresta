/**
 * Utilitário multiplataforma para abertura, sanitização e manipulação de URLs externas.
 * Suporta Web, Android (Tauri) e Desktop (Tauri).
 */

export function sanitizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Se já começar com protocolo suportado, mantém
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  // Se for endereço relativo ou sem protocolo, prefixa com https://
  return `https://${trimmed}`;
}

export function extractDomain(rawUrl: string): string {
  if (!rawUrl) return '';
  const sanitized = sanitizeUrl(rawUrl);
  try {
    const parsed = new URL(sanitized);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl.trim();
  }
}

export function getFaviconUrl(rawUrl: string, size = 64): string {
  const domain = extractDomain(rawUrl);
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}

export function cleanUrlTitle(rawUrl: string, fallbackTitle?: string): string {
  if (fallbackTitle && fallbackTitle.trim()) {
    return fallbackTitle.trim();
  }
  const domain = extractDomain(rawUrl);
  return domain || rawUrl.trim() || 'Link';
}

/**
 * Abre uma URL externa no navegador padrão do sistema do usuário de forma segura.
 * Funciona de forma transparente no navegador Web, no Desktop (Tauri) e no Android (Tauri).
 */
export async function openExternalUrl(rawUrl: string): Promise<void> {
  const url = sanitizeUrl(rawUrl);
  if (!url) return;

  // 1. Tentar API nativa do Tauri se disponível em runtime
  if (typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
    try {
      const globalTauri = (window as unknown as { __TAURI__?: { opener?: { openUrl?: (u: string) => Promise<void> } } }).__TAURI__;
      if (globalTauri?.opener?.openUrl) {
        await globalTauri.opener.openUrl(url);
        return;
      }
      
      const pkg = '@tauri-apps/plugin-opener';
      const openerModule = await import(/* @vite-ignore */ pkg).catch(() => null);
      if (openerModule?.openUrl && typeof openerModule.openUrl === 'function') {
        await openerModule.openUrl(url);
        return;
      }
    } catch {
      // Prossegue para o fallback seguro de window.open
    }
  }

  // 2. Fallback universal para Web / WebViews com target _blank e noopener
  if (typeof window !== 'undefined') {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.opener = null;
    }
  }
}
