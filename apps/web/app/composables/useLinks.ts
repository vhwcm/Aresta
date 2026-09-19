import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { linkRepo } from '~/adapters/database/repositories/LinkRepository';
import type { LocalLinkItem } from '~/adapters/database/types';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeUrl, cleanUrlTitle, extractDomain, getFaviconUrl } from '~/utils/urlOpener';

const linksList = ref<LocalLinkItem[]>([]);
const linkFolders = ref<string[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

export const resetLinksMemory = () => {
  linksList.value = [];
  linkFolders.value = [];
  isLoading.value = false;
  error.value = null;
};

export function useLinks() {
  const { token, user } = useAuth();

  const fetchLinks = async (params: { folder?: string; tag?: string; search?: string } = {}) => {
    isLoading.value = true;
    error.value = null;

    if (!token?.value && !user?.value) {
      linksList.value = [];
      isLoading.value = false;
      return [];
    }

    try {
      const items = await linkRepo.getAll(params);
      linksList.value = items;
      return items;
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar links';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const fetchLinkFolders = async () => {
    try {
      const folders = await linkRepo.getFolders();
      linkFolders.value = folders;
      return folders;
    } catch {
      return [];
    }
  };

  const createLink = async (payload: {
    url: string;
    title?: string;
    folder?: string | null;
    tags?: string[];
    sourceNoteId?: string | null;
    sourceCanvasId?: string | null;
  }): Promise<LocalLinkItem | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      const sanitized = sanitizeUrl(payload.url);
      if (!sanitized) {
        throw new Error('URL inválida ou vazia');
      }

      const id = uuidv4();
      const domain = extractDomain(sanitized);
      const title = cleanUrlTitle(sanitized, payload.title);
      const favicon = getFaviconUrl(sanitized);

      const saved = await linkRepo.save({
        id,
        url: sanitized,
        title,
        domain,
        favicon,
        folder: payload.folder || null,
        tags: payload.tags || [],
        sourceNoteId: payload.sourceNoteId || null,
        sourceCanvasId: payload.sourceCanvasId || null,
      });

      linksList.value = [saved, ...linksList.value.filter((l) => l.id !== saved.id)];
      return saved;
    } catch (err: any) {
      error.value = err.message || 'Erro ao criar link';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const updateLink = async (id: string, payload: Partial<LocalLinkItem>): Promise<LocalLinkItem | null> => {
    try {
      const saved = await linkRepo.save({ ...payload, id, url: payload.url || '' });
      linksList.value = linksList.value.map((l) => (l.id === id ? saved : l));
      return saved;
    } catch (err: any) {
      error.value = err.message || 'Erro ao atualizar link';
      return null;
    }
  };

  const removeLink = async (id: string): Promise<boolean> => {
    try {
      await linkRepo.delete(id);
      linksList.value = linksList.value.filter((l) => l.id !== id);
      return true;
    } catch (err: any) {
      error.value = err.message || 'Erro ao excluir link';
      return false;
    }
  };

  return {
    linksList,
    linkFolders,
    isLoading,
    error,
    fetchLinks,
    fetchLinkFolders,
    createLink,
    updateLink,
    removeLink,
  };
}
