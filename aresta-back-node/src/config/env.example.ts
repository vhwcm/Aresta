/**
 * Arquivo de exemplo/documentação tipada para variáveis de ambiente.
 * Copie as chaves para seu arquivo .env local.
 */
export interface EnvironmentVariablesExample {
  PORT: number;          // Ex: 7070
  DATABASE_URL: string;  // Ex: "file:./dev.db"
  JWT_SECRET: string;    // Ex: "sua_chave_secreta_jwt"
  DEBUG: boolean;        // Ex: true
  STORAGE_PATH: string;  // Ex: "./storage"
}

export const ENV_EXAMPLE_DEFAULTS: EnvironmentVariablesExample = {
  PORT: 7070,
  DATABASE_URL: 'file:./dev.db',
  JWT_SECRET: 'aresta_super_secret_jwt_key_change_in_production',
  DEBUG: true,
  STORAGE_PATH: './storage',
};

