import { ref, computed } from 'vue';

const isNavbarCollapsed = ref(false);
const isEcosystemOpen = ref(false);

export function getNavIndexFromPath(path: string): number {
  if (!path || path === '/') return 0;
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
  if (path === '/canvas' || path.startsWith('/notes')) {
    return 2;
  }
  if (path.startsWith('/revisao') || path.startsWith('/curva-do-esquecimento')) {
    return 3;
  }
  if (path.startsWith('/conta') || path.startsWith('/users') || path.startsWith('/admin')) {
    return 4;
  }
  return -1;
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
    toggleCollapse,
    expandNavbar,
    collapseNavbar,
    getNavIndexFromPath,
  };
}
