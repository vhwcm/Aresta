import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettings, applyTheme, resetSettingsForTesting } from '../../../app/composables/useSettings';

vi.mock('../../../app/composables/useAuth', () => ({
  useAuth: () => ({
    token: { value: null },
  }),
}));

describe('useSettings composable', () => {
  beforeEach(() => {
    localStorage.clear();
    resetSettingsForTesting();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    if (document.body) {
      document.body.className = '';
    }
  });

  it('aplica tema escuro corretamente no DOM', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('aplica tema claro corretamente no DOM', () => {
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('aplica tema sépia corretamente no DOM', () => {
    applyTheme('sepia');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sepia');
    expect(document.documentElement.classList.contains('sepia-theme')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('alterna o modo de tema ciclicamente (dark -> light -> sepia -> dark)', () => {
    const { themeMode, toggleThemeMode, setThemeMode } = useSettings();

    setThemeMode('dark');
    expect(themeMode.value).toBe('dark');

    toggleThemeMode();
    expect(themeMode.value).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    toggleThemeMode();
    expect(themeMode.value).toBe('sepia');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sepia');

    toggleThemeMode();
    expect(themeMode.value).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
