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
      };
    }

    return {
      userId: settings.user_id,
      pageAnimationEnabled: settings.page_animation_enabled,
      language: settings.language,
    };
  }

  async updateSettings(userId: number, input: UpdateUserSettingsInput) {
    const pageAnimationEnabled = input.pageAnimationEnabled ?? true;
    const language = input.language ?? 'pt-BR';

    const updated = await prisma.userSettings.upsert({
      where: { user_id: userId },
      update: {
        page_animation_enabled: pageAnimationEnabled,
        language,
      },
      create: {
        user_id: userId,
        page_animation_enabled: pageAnimationEnabled,
        language,
      },
    });

    return {
      userId: updated.user_id,
      pageAnimationEnabled: updated.page_animation_enabled,
      language: updated.language,
    };
  }
}

