import '../src/config/env'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`

  const passwordHash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@aresta.app' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@aresta.app',
      password_hash: passwordHash,
      role: 'ADMIN',
    },
  })

  const viktorHash = await bcrypt.hash('orlaweb123123#', 10)
  await prisma.user.upsert({
    where: { email: 'viktor@aresta.org' },
    update: {},
    create: {
      name: 'viktor',
      email: 'viktor@aresta.org',
      password_hash: viktorHash,
      role: 'ADMIN',
    },
  })

  console.log('[aresta-api] Database seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
