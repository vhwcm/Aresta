import { ref, computed } from 'vue';

const isNavbarCollapsed = ref(false);
const isEcosystemOpen = ref(false);

const getInitialNavIndex = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('aresta_last_nav_index');
      if (stored !== null && !isNaN(Number(stored))) {
        const val = Number(stored);
        if (val >= 0 && val <= 4) return val;
      }
    } catch {
      // ignore
    }
  }
  return 0;
};

const lastActiveNavIndex = ref<number>(getInitialNavIndex());

export function getNavIndexFromPath(path: string): number {
  if (!path || path === '/' || path === '/canvas' || path.startsWith('/notes')) return 0;
  if (
    path.startsWith('/library') ||
    path.startsWith('/upload') ||
    path.startsWith('/livros') ||
    path.startsWith('/conversor') ||
    path.startsWith('/loja') ||
    path.startsWith('/books')
  ) {
    return 1;
  }
  if (path.startsWith('/revisao') || path.startsWith('/curva-do-esquecimento')) {
    return 2;
  }
  if (path.startsWith('/conta') || path.startsWith('/users') || path.startsWith('/admin')) {
    return 3;
  }
  return -1;
}

export function getEffectiveNavIndex(path: string): number {
  const direct = getNavIndexFromPath(path);
  if (direct >= 0) {
    lastActiveNavIndex.value = direct;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('aresta_last_nav_index', String(direct));
      } catch {
        // ignore
      }
    }
    return direct;
  }
  // Se não houver página direta da navbar aberta, mantém selecionada a última
  return lastActiveNavIndex.value;
}

export function useBottomNavbar() {
  const toggleCollapse = () => {
    isNavbarCollapsed.value = !isNavbarCollapsed.value;
    if (isNavbarCollapsed.value) {
      isEcosystemOpen.value = false;
    }
  };

  const expandNavbar = () => {
    isNavbarCollapsed.value = false;
  };

  const collapseNavbar = () => {
    isNavbarCollapsed.value = true;
    isEcosystemOpen.value = false;
  };

  return {
    isNavbarCollapsed,
    isEcosystemOpen,
    lastActiveNavIndex,
    toggleCollapse,
    expandNavbar,
    collapseNavbar,
    getNavIndexFromPath,
    getEffectiveNavIndex,
  };
}
