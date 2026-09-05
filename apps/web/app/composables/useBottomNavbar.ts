import { ref } from 'vue';

const isNavbarCollapsed = ref(false);
const isEcosystemOpen = ref(false);

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
  };
}
