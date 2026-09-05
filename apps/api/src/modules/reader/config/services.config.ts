export const SERVICES = {
  auth:   process.env.AUTH_SERVICE_URL   ?? 'http://localhost:3001',
  ai:     process.env.AI_SERVICE_URL     ?? 'http://localhost:3002',
  memory: process.env.MEMORY_SERVICE_URL ?? 'http://localhost:3005',
} as const
