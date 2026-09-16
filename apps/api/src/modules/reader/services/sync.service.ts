export class SyncService {
  async sync(_userId: number, _payload: any) {
    return { status: 'gone', message: 'Local-first architecture' }
  }
}
export const syncService = new SyncService()
