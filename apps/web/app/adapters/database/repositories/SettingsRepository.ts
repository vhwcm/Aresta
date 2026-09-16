import { getDatabase, dbManager } from '../DatabaseManager';
import type { LocalUserSettings } from '../types';

export class SettingsRepository {
  private getDb() {
    return getDatabase();
  }

  async get(): Promise<LocalUserSettings | null> {
    return this.getDb().getSettings();
  }

  async save(settings: Partial<LocalUserSettings>): Promise<LocalUserSettings> {
    const existing = await this.getDb().getSettings();
    const now = new Date().toISOString();
    const entity: LocalUserSettings = {
      id: 'user_settings',
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
      readerTwoPageMode: true,
      readerWidthMode: 'centered',
      readerTheme: 'sepia',
      ...existing,
      ...settings,
      updated_at: now,
      deleted_at: null,
      sync_status: 'pending'
    };
    await this.getDb().saveSettings(entity);
    await dbManager.recordMutation('settings', 'user_settings', 'UPDATE', entity);
    return entity;
  }
}

export const settingsRepo = new SettingsRepository();
