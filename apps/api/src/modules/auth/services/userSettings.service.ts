import { prisma } from '../config/database'

export class UserSettingsService {
  async findByUser(userId: number) {
    return prisma.userSettings.findUnique({ where: { user_id: userId } })
  }

  async upsert(userId: number, rawData: Record<string, any>) {
    const data: Record<string, any> = {}

    if (rawData.page_animation_enabled !== undefined || rawData.pageAnimationEnabled !== undefined) {
      data.page_animation_enabled = Boolean(rawData.page_animation_enabled ?? rawData.pageAnimationEnabled)
    }
    if (rawData.page_crease_enabled !== undefined || rawData.pageCreaseEnabled !== undefined) {
      data.page_crease_enabled = Boolean(rawData.page_crease_enabled ?? rawData.pageCreaseEnabled)
    }
    if (rawData.language !== undefined) {
      data.language = String(rawData.language)
    }
    if (rawData.native_language !== undefined || rawData.nativeLanguage !== undefined) {
      data.native_language = String(rawData.native_language ?? rawData.nativeLanguage)
    }
    if (rawData.target_translation_language !== undefined || rawData.targetTranslationLanguage !== undefined) {
      data.target_translation_language = String(rawData.target_translation_language ?? rawData.targetTranslationLanguage)
    }
    if (rawData.epub_font_size !== undefined || rawData.epubFontSize !== undefined) {
      const parsed = Number(rawData.epub_font_size ?? rawData.epubFontSize)
      if (!isNaN(parsed)) data.epub_font_size = parsed
    }
    if (rawData.epub_font_family !== undefined || rawData.epubFontFamily !== undefined) {
      data.epub_font_family = String(rawData.epub_font_family ?? rawData.epubFontFamily)
    }
    if (rawData.theme_mode !== undefined || rawData.themeMode !== undefined) {
      data.theme_mode = String(rawData.theme_mode ?? rawData.themeMode)
    }
    if (rawData.desktop_home_graph_open !== undefined || rawData.desktopHomeGraphOpen !== undefined) {
      data.desktop_home_graph_open = Boolean(rawData.desktop_home_graph_open ?? rawData.desktopHomeGraphOpen)
    }
    if (rawData.desktop_reader_graph_open !== undefined || rawData.desktopReaderGraphOpen !== undefined) {
      data.desktop_reader_graph_open = Boolean(rawData.desktop_reader_graph_open ?? rawData.desktopReaderGraphOpen)
    }

    return prisma.userSettings.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    })
  }
}

export const userSettingsService = new UserSettingsService()
