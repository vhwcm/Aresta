/**
 * Configuração centralizada de rotas e diretórios de armazenamento
 */

export const API_PREFIX = '/api';

export const ROUTES = {
  // Rotas da API REST
  AUTH: '/api/auth',
  USERS_ME: '/api/users/me',
  USERS: '/api/users',
  BOOKS: '/api/books',
  USER_BOOKS: '/api/user-books',
  USER_SETTINGS: '/api/user-settings',
  GRAPH: '/api/graph',
  ANNOTATIONS: '/api/annotations',
  OCR: '/api/ocr',
  HEALTH: '/api/health',
  CONVERT: '/api/convert',

  // Rotas de arquivos estáticos
  COVERS: '/covers',
  EPUBS: '/epubs',
  PDFS: '/pdfs',

  // Documentação Swagger
  DOCS: '/api-docs',
  DOCS_JSON: '/api-docs.json',
} as const;

export const STORAGE_DIRS = {
  PDFS: 'storage/pdfs',
  EPUBS: 'storage/epubs',
  COVERS: 'storage/covers',
  BOOKS: 'storage/books', // Mantido para compatibilidade retroativa
} as const;
