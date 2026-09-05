// URLs dos outros microserviços — configurados por variável de ambiente
export const SERVICES = {
  ai:     process.env.AI_SERVICE_URL     ?? 'http://localhost:3002',
  reader: process.env.READER_SERVICE_URL ?? 'http://localhost:3003',
  canvas: process.env.CANVAS_SERVICE_URL ?? 'http://localhost:3004',
  memory: process.env.MEMORY_SERVICE_URL ?? 'http://localhost:3005',
} as const
