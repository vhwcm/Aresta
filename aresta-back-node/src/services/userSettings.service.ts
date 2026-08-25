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
        language: 'pt-BR',
        epubFontSize: 18,
      };
    }

    return {
      userId: settings.user_id,
      pageAnimationEnabled: settings.page_animation_enabled,
      language: settings.language,
      epubFontSize: (settings as any).epub_font_size ?? 18,
    };
  }

  async updateSettings(userId: number, input: UpdateUserSettingsInput) {
    const pageAnimationEnabled = input.pageAnimationEnabled ?? true;
    const language = input.language ?? 'pt-BR';
    const epubFontSize = input.epubFontSize ?? 18;

    const updated = await prisma.userSettings.upsert({
      where: { user_id: userId },
      update: {
        page_animation_enabled: pageAnimationEnabled,
        language,
        epub_font_size: epubFontSize,
      },
      create: {
        user_id: userId,
        page_animation_enabled: pageAnimationEnabled,
        language,
        epub_font_size: epubFontSize,
      },
    });

    return {
      userId: updated.user_id,
      pageAnimationEnabled: updated.page_animation_enabled,
      language: updated.language,
      epubFontSize: (updated as any).epub_font_size ?? 18,
    };
  }
}

