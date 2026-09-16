export class UserSettingsService {
  async getByUserId(_userId: number) {
    return {
      pageAnimationEnabled: true,
      pageCreaseEnabled: true,
      language: 'pt-BR',
      nativeLanguage: 'pt-BR',
      targetTranslationLanguage: 'en',
      epubFontSize: 18,
      epubFontFamily: 'newsreader',
      themeMode: 'light',
      desktopHomeGraphOpen: true,
      desktopReaderGraphOpen: false,
    }
  }

  async upsert(_userId: number, data: any) {
    return { ...data }
  }
}

export const userSettingsService = new UserSettingsService()
