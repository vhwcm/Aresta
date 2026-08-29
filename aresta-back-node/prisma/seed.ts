import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '../src/services/seed.service.js';

const prisma = new PrismaClient();

async function main() {
  await seedDatabase(prisma);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

