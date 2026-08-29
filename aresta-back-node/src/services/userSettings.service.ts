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
    const pageAnimationEnabled = input.pageAnimationEnabled ?? true;
    const pageCreaseEnabled = input.pageCreaseEnabled ?? true;
    const language = input.language ?? 'pt-BR';
    const nativeLanguage = input.nativeLanguage ?? 'pt-BR';
    const targetTranslationLanguage = input.targetTranslationLanguage ?? 'en';
    const epubFontSize = input.epubFontSize ?? 18;
    const epubFontFamily = input.epubFontFamily ?? 'newsreader';
    const themeMode = input.themeMode ?? 'dark';
    const desktopHomeGraphOpen = input.desktopHomeGraphOpen ?? false;
    const desktopReaderGraphOpen = input.desktopReaderGraphOpen ?? false;

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
      pageCreaseEnabled: (updated as any).page_crease_enabled ?? true,
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

