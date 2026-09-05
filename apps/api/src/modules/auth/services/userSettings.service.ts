import { prisma } from '../config/database'

export class UserSettingsService {
  async findByUser(userId: number) {
    return prisma.userSettings.findUnique({ where: { user_id: userId } })
  }

  async upsert(
    userId: number,
    data: {
      page_animation_enabled?: boolean
      page_crease_enabled?: boolean
      language?: string
      native_language?: string
      target_translation_language?: string
      epub_font_size?: number
      epub_font_family?: string
      theme_mode?: string
      desktop_home_graph_open?: boolean
      desktop_reader_graph_open?: boolean
    }
  ) {
    return prisma.userSettings.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    })
  }
}

export const userSettingsService = new UserSettingsService()
