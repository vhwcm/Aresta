import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { flashcardSchedulerService } from './services/flashcardScheduler.service.js';
import { seedDatabase } from './services/seed.service.js';

async function bootstrap() {
  try {
    console.log('🚀 Iniciando Aresta Backend Server com Express e TypeScript...');
    console.log(`🔧 Modo Debug: ${env.DEBUG}, Banco: ${env.DATABASE_URL}`);

    // Conectar ao banco via Prisma
    await prisma.$connect();
    console.log('💾 Conexão com banco de dados SQLite estabelecida.');

    // Auto-seed: verificar se o acervo e o usuário admin viktor precisam ser sincronizados
    try {
      const admin = await prisma.user.findUnique({ where: { email: 'viktor@aresta.org' } });
      const bookCount = await prisma.book.count();
      const userBookCount = admin ? await prisma.userBook.count({ where: { user_id: admin.id } }) : 0;
      if (!admin || bookCount < 10 || userBookCount < 10) {
        console.log('📦 Inicializando/sincronizando acervo e estante do admin viktor...');
        await seedDatabase(prisma);
      }
    } catch (seedErr) {
      console.warn('⚠ Aviso ao verificar seed inicial:', seedErr);
    }

    // Iniciar scheduler de flashcards
    flashcardSchedulerService.start();

    const server = app.listen(env.PORT, () => {
      console.log(`\n==================================================`);
      console.log(`✅ Servidor Express rodando com sucesso em: http://localhost:${env.PORT}`);
      console.log(`📖 Documentação Swagger UI disponível em: http://localhost:${env.PORT}/api-docs`);
      console.log(`🏥 Healthcheck disponível em: http://localhost:${env.PORT}/api/health`);
      console.log(`==================================================\n`);
    });

    // Tratamento de encerramento gracioso
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Recebido sinal ${signal}. Encerrando servidor graciosamente...`);
      flashcardSchedulerService.stop();
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔒 Servidor e conexões com banco encerradas.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Falha ao iniciar o servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

