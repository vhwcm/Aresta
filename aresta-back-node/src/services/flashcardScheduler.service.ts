import { prisma } from '../config/prisma.js';
import { flashcardService } from './flashcard.service.js';

export class FlashcardSchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private lastExecuted22hDate: string | null = null;
  private lastExecuted00hDate: string | null = null;

  /**
   * Inicia o scheduler em background
   */
  public start() {
    if (this.timer) return;

    console.log('[FlashcardScheduler] Serviço de agendamento de flashcards inicializado (22:00 geração / 00:00 daily deck).');

    // Checa a cada minuto
    this.timer = setInterval(async () => {
      await this.checkSchedule();
    }, 60 * 1000);
  }

  /**
   * Para o scheduler
   */
  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[FlashcardScheduler] Serviço de agendamento parado.');
    }
  }

  /**
   * Avalia a hora atual e executa os jobs nos horários configurados (22:00 e 00:00)
   */
  public async checkSchedule() {
    const now = new Date();
    const hours = now.getHours();
    const dateStr = now.toISOString().split('T')[0];

    // Job das 22:00 (22h - 22h59)
    if (hours === 22 && this.lastExecuted22hDate !== dateStr) {
      this.lastExecuted22hDate = dateStr;
      await this.run22hJob();
    }

    // Job das 00:00 (00h - 00h59)
    if (hours === 0 && this.lastExecuted00hDate !== dateStr) {
      this.lastExecuted00hDate = dateStr;
      await this.run00hJob();
    }
  }

  /**
   * Job das 22:00: Gera flashcards 1:1 para todas as novas anotações pendentes
   */
  public async run22hJob() {
    console.log('[FlashcardScheduler] Iniciando Job das 22:00: Geração incremental de flashcards para anotações pendentes...');
    const start = Date.now();
    try {
      const activeUsers = await prisma.user.findMany({
        where: { is_active: true },
        select: { id: true },
      });

      let totalGenerated = 0;
      for (const user of activeUsers) {
        const res = await flashcardService.generatePendingFlashcards(user.id, 50);
        totalGenerated += res.totalGenerated;
      }

      const elapsed = Date.now() - start;
      console.log(`[FlashcardScheduler] Job das 22:00 concluído em ${elapsed}ms. Total de novos flashcards gerados: ${totalGenerated}.`);
      return { totalGenerated, elapsedMs: elapsed };
    } catch (err) {
      console.error('[FlashcardScheduler] Erro ao executar Job das 22:00:', err);
      throw err;
    }
  }

  /**
   * Job das 00:00: Prepara previamente os decks diários de 50 cards para todos os usuários ativos
   */
  public async run00hJob() {
    console.log('[FlashcardScheduler] Iniciando Job das 00:00: Preparação de decks diários de 50 cards...');
    const start = Date.now();
    try {
      const activeUsers = await prisma.user.findMany({
        where: { is_active: true },
        select: { id: true },
      });

      let totalDecksCreated = 0;
      for (const user of activeUsers) {
        const deck = await flashcardService.getOrCreateDailyDeck(user.id);
        if (deck.cards.length > 0) {
          totalDecksCreated++;
        }
      }

      const elapsed = Date.now() - start;
      console.log(`[FlashcardScheduler] Job das 00:00 concluído em ${elapsed}ms. Decks diários preparados para ${totalDecksCreated} usuários.`);
      return { totalDecksCreated, elapsedMs: elapsed };
    } catch (err) {
      console.error('[FlashcardScheduler] Erro ao executar Job das 00:00:', err);
      throw err;
    }
  }
}

export const flashcardSchedulerService = new FlashcardSchedulerService();
