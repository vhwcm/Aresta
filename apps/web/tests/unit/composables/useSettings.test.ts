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

  it('sincroniza o tema do app quando o tema da leitura é alterado', () => {
    const { themeMode, readerTheme, setReaderTheme } = useSettings();

    setReaderTheme('black');
    expect(readerTheme.value).toBe('black');
    expect(themeMode.value).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);

    setReaderTheme('sepia');
    expect(readerTheme.value).toBe('sepia');
    expect(themeMode.value).toBe('sepia');
    expect(document.documentElement.getAttribute('data-theme')).toBe('sepia');
    expect(document.documentElement.classList.contains('sepia-theme')).toBe(true);

    setReaderTheme('white');
    expect(readerTheme.value).toBe('white');
    expect(themeMode.value).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('light-theme')).toBe(true);
  });

  it('aplica escala de layout 125% por padrão e reflete no DOM', () => {
    const { uiScale } = useSettings();
    expect(uiScale.value).toBe('125%');
    expect(document.documentElement.getAttribute('data-ui-scale')).toBe('125%');
    expect(document.documentElement.style.fontSize).toBe('125%');
  });

  it('permite alterar a escala da interface dinamicamente (100%, 110%, 125%, 150%)', () => {
    const { uiScale, setUiScale } = useSettings();

    setUiScale('100%');
    expect(uiScale.value).toBe('100%');
    expect(document.documentElement.getAttribute('data-ui-scale')).toBe('100%');
    expect(document.documentElement.style.fontSize).toBe('100%');
    expect(localStorage.getItem('aresta_ui_scale')).toBe('100%');

    setUiScale('150%');
    expect(uiScale.value).toBe('150%');
    expect(document.documentElement.getAttribute('data-ui-scale')).toBe('150%');
    expect(document.documentElement.style.fontSize).toBe('150%');
    expect(localStorage.getItem('aresta_ui_scale')).toBe('150%');

    setUiScale('125%');
    expect(uiScale.value).toBe('125%');
    expect(document.documentElement.getAttribute('data-ui-scale')).toBe('125%');
    expect(document.documentElement.style.fontSize).toBe('125%');
    expect(localStorage.getItem('aresta_ui_scale')).toBe('125%');
  });
});

