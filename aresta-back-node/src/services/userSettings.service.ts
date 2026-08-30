import { prisma } from '../config/prisma.js';
import { UpdateUserSettingsInput } from '../schemas/userSettings.schema.js';

export class UserSettingsService {
  async getSettings(userId: number) {
    const settings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      return {
        userId,
        pageAnimationEnabled: true,
        pageCreaseEnabled: true,
        language: 'pt-BR',
        nativeLanguage: 'pt-BR',
        targetTranslationLanguage: 'en',
        epubFontSize: 18,
        epubFontFamily: 'newsreader',
        themeMode: 'dark',
        desktopHomeGraphOpen: false,
        desktopReaderGraphOpen: false,
      };
    }

    return {
      userId: settings.user_id,
      pageAnimationEnabled: settings.page_animation_enabled,
      pageCreaseEnabled: (settings as any).page_crease_enabled ?? true,
      language: settings.language,
      nativeLanguage: (settings as any).native_language ?? 'pt-BR',
      targetTranslationLanguage: (settings as any).target_translation_language ?? 'en',
      epubFontSize: (settings as any).epub_font_size ?? 18,
      epubFontFamily: (settings as any).epub_font_family ?? 'newsreader',
      themeMode: (settings as any).theme_mode ?? 'dark',
      desktopHomeGraphOpen: (settings as any).desktop_home_graph_open ?? false,
      desktopReaderGraphOpen: (settings as any).desktop_reader_graph_open ?? false,
    };
  }

  async updateSettings(userId: number, input: UpdateUserSettingsInput) {
    const current = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    });

    const pageAnimationEnabled = input.pageAnimationEnabled ?? current?.page_animation_enabled ?? true;
    let pageCreaseEnabled = input.pageCreaseEnabled ?? (current as any)?.page_crease_enabled ?? true;

    // Se a animação 3D de páginas estiver desligada, os efeitos de livro não podem estar ativos
    if (pageAnimationEnabled === false) {
      pageCreaseEnabled = false;
    }

    const language = input.language ?? current?.language ?? 'pt-BR';
    const nativeLanguage = input.nativeLanguage ?? (current as any)?.native_language ?? 'pt-BR';
    const targetTranslationLanguage = input.targetTranslationLanguage ?? (current as any)?.target_translation_language ?? 'en';
    const epubFontSize = input.epubFontSize ?? (current as any)?.epub_font_size ?? 18;
    const epubFontFamily = input.epubFontFamily ?? (current as any)?.epub_font_family ?? 'newsreader';
    const themeMode = input.themeMode ?? (current as any)?.theme_mode ?? 'dark';
    const desktopHomeGraphOpen = input.desktopHomeGraphOpen ?? (current as any)?.desktop_home_graph_open ?? false;
    const desktopReaderGraphOpen = input.desktopReaderGraphOpen ?? (current as any)?.desktop_reader_graph_open ?? false;

    const updated = await prisma.userSettings.upsert({
      where: { user_id: userId },
      update: {
        page_animation_enabled: pageAnimationEnabled,
        page_crease_enabled: pageCreaseEnabled,
        language,
        native_language: nativeLanguage,
        target_translation_language: targetTranslationLanguage,
        epub_font_size: epubFontSize,
        epub_font_family: epubFontFamily,
        theme_mode: themeMode,
        desktop_home_graph_open: desktopHomeGraphOpen,
        desktop_reader_graph_open: desktopReaderGraphOpen,
      },
      create: {
        user_id: userId,
        page_animation_enabled: pageAnimationEnabled,
        page_crease_enabled: pageCreaseEnabled,
        language,
        native_language: nativeLanguage,
        target_translation_language: targetTranslationLanguage,
        epub_font_size: epubFontSize,
        epub_font_family: epubFontFamily,
        theme_mode: themeMode,
        desktop_home_graph_open: desktopHomeGraphOpen,
        desktop_reader_graph_open: desktopReaderGraphOpen,
      },
    });

    return {
      userId: updated.user_id,
      pageAnimationEnabled: updated.page_animation_enabled,
      pageCreaseEnabled: (updated as any).page_crease_enabled ?? false,
      language: updated.language,
      nativeLanguage: (updated as any).native_language ?? 'pt-BR',
      targetTranslationLanguage: (updated as any).target_translation_language ?? 'en',
      epubFontSize: (updated as any).epub_font_size ?? 18,
      epubFontFamily: (updated as any).epub_font_family ?? 'newsreader',
      themeMode: (updated as any).theme_mode ?? 'dark',
      desktopHomeGraphOpen: (updated as any).desktop_home_graph_open ?? false,
      desktopReaderGraphOpen: (updated as any).desktop_reader_graph_open ?? false,
    };
  }
}

