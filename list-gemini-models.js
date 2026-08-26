#!/usr/bin/env node

/**
 * Script para listar todos os modelos Gemini disponíveis na API do Google Generative Language.
 * Carrega a chave de API de arquivos .env (.env, front/.env, aresta-back-node/.env)
 * ou de variáveis de ambiente (AI_KEY, GEMINI_API_KEY, GOOGLE_API_KEY).
 *
 * Uso:
 *   node list-gemini-models.js
 *   node list-gemini-models.js --json
 *   node list-gemini-models.js --filter=flash
 *   node list-gemini-models.js SUA_CHAVE_AQUI
 */

const fs = require('node:fs');
const path = require('node:path');

// Cores ANSI para saída no terminal
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m\x1b[37m\x1b[1m',
};

/**
 * Carrega pares chave-valor de arquivos .env sem depender de pacotes externos
 */
function loadEnvFiles() {
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, 'front', '.env'),
    path.join(__dirname, 'aresta-back-node', '.env'),
  ];

  const envVars = {};

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex !== -1) {
            const key = trimmed.slice(0, eqIndex).trim();
            let val = trimmed.slice(eqIndex + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (key && !(key in envVars)) {
              envVars[key] = val;
            }
          }
        }
      } catch {
        // Ignora erros de leitura de arquivo individual
      }
    }
  }

  return envVars;
}

/**
 * Obtém a chave da API do Gemini a partir dos argumentos CLI, variáveis de ambiente ou arquivos .env
 */
function getApiKey() {
  const args = process.argv.slice(2);

  // 1. Argumentos de linha de comando
  for (const arg of args) {
    if (arg.startsWith('--key=')) {
      return arg.split('=')[1];
    }
    if (!arg.startsWith('-') && arg.length > 20) {
      return arg;
    }
  }

  // 2. Variáveis de ambiente do processo
  const envKeys = ['AI_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY'];
  for (const key of envKeys) {
    if (process.env[key]) return process.env[key];
  }

  // 3. Arquivos .env
  const localEnvs = loadEnvFiles();
  for (const key of envKeys) {
    if (localEnvs[key]) return localEnvs[key];
  }

  return null;
}

/**
 * Formata número de tokens com separador de milhar
 */
function formatTokens(count) {
  if (count === undefined || count === null) return 'N/A';
  return Number(count).toLocaleString('pt-BR');
}

/**
 * Mascara chave para exibição segura no terminal
 */
function maskApiKey(key) {
  if (!key) return '';
  if (key.length <= 8) return '********';
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}

/**
 * Consulta a lista de modelos da Google Generative AI API
 */
async function fetchModels(apiKey) {
  let allModels = [];
  let pageToken = '';

  do {
    const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('pageSize', '100');
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || response.statusText;
      const errCode = data?.error?.code || response.status;
      throw new Error(`[HTTP ${errCode}] ${errMsg}`);
    }

    if (data.models && Array.isArray(data.models)) {
      allModels = allModels.concat(data.models);
    }

    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return allModels;
}

async function main() {
  const args = process.argv.slice(2);
  const isJson = args.includes('--json');
  const filterArg = args.find((a) => a.startsWith('--filter='));
  const filterValue = filterArg ? filterArg.split('=')[1].toLowerCase() : null;

  const apiKey = getApiKey();

  if (!apiKey) {
    console.error(`\n${colors.red}${colors.bold}❌ Chave de API não encontrada!${colors.reset}`);
    console.error(`\nPor favor, defina a variável ${colors.yellow}AI_KEY${colors.reset} ou ${colors.yellow}GEMINI_API_KEY${colors.reset} em seu arquivo ${colors.cyan}.env${colors.reset}`);
    console.error(`ou passe a chave como argumento:`);
    console.error(`  ${colors.dim}node list-gemini-models.js AIzaSy...${colors.reset}\n`);
    process.exit(1);
  }

  if (!isJson) {
    console.log(`\n${colors.cyan}${colors.bold}✦ Google Gemini - Lista de Modelos Disponíveis ✦${colors.reset}`);
    console.log(`${colors.gray}Chave detectada:${colors.reset} ${colors.green}${maskApiKey(apiKey)}${colors.reset}`);
    console.log(`${colors.gray}Buscando modelos junto à API do Google Generative Language...${colors.reset}\n`);
  }

  try {
    let models = await fetchModels(apiKey);

    if (filterValue) {
      models = models.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(filterValue)) ||
          (m.displayName && m.displayName.toLowerCase().includes(filterValue)) ||
          (m.description && m.description.toLowerCase().includes(filterValue))
      );
    }

    if (isJson) {
      console.log(JSON.stringify(models, null, 2));
      return;
    }

    if (models.length === 0) {
      console.log(`${colors.yellow}Nenhum modelo encontrado com os filtros aplicados.${colors.reset}\n`);
      return;
    }

    // Separação em categorias
    const generateContentModels = models.filter((m) =>
      m.supportedGenerationMethods?.includes('generateContent')
    );
    const otherModels = models.filter(
      (m) => !m.supportedGenerationMethods?.includes('generateContent')
    );

    console.log(`${colors.bold}Total de modelos encontrados:${colors.reset} ${colors.cyan}${models.length}${colors.reset}`);
    console.log(
      `${colors.dim}(Modelos de Texto/Multimodal: ${generateContentModels.length} | Outros/Embeddings: ${otherModels.length})${colors.reset}\n`
    );

    // Exibir modelos de geração de conteúdo (chat/visão/código)
    if (generateContentModels.length > 0) {
      console.log(`${colors.bgBlue} 🤖 MODELOS DE GERAÇÃO DE CONTEÚDO (Chat & Multimodal) ${colors.reset}\n`);

      for (const m of generateContentModels) {
        const cleanName = m.name.replace(/^models\//, '');
        const isGemini = cleanName.toLowerCase().includes('gemini');
        const nameColor = isGemini ? colors.cyan : colors.blue;

        console.log(`  ${colors.bold}${nameColor}${cleanName}${colors.reset} ${colors.gray}(${m.displayName || cleanName})${colors.reset}`);
        
        if (m.description) {
          console.log(`    ${colors.dim}${m.description.trim()}${colors.reset}`);
        }

        const inputLimit = formatTokens(m.inputTokenLimit);
        const outputLimit = formatTokens(m.outputTokenLimit);
        const methods = m.supportedGenerationMethods?.join(', ') || 'Nenhum';

        console.log(
          `    ${colors.yellow}Tokens Entrada:${colors.reset} ${inputLimit} | ` +
          `${colors.yellow}Tokens Saída:${colors.reset} ${outputLimit} | ` +
          `${colors.magenta}Métodos:${colors.reset} ${methods}`
        );
        console.log('');
      }
    }

    // Exibir outros modelos (embeddings, etc.)
    if (otherModels.length > 0) {
      console.log(`${colors.bgBlue} 🔍 OUTROS MODELOS (Embeddings / Especializados) ${colors.reset}\n`);

      for (const m of otherModels) {
        const cleanName = m.name.replace(/^models\//, '');
        console.log(`  ${colors.bold}${colors.magenta}${cleanName}${colors.reset} ${colors.gray}(${m.displayName || cleanName})${colors.reset}`);
        if (m.description) {
          console.log(`    ${colors.dim}${m.description.trim()}${colors.reset}`);
        }
        const methods = m.supportedGenerationMethods?.join(', ') || 'Nenhum';
        console.log(`    ${colors.magenta}Métodos:${colors.reset} ${methods}`);
        console.log('');
      }
    }

    console.log(`${colors.green}✔ Lista de modelos carregada com sucesso.${colors.reset}\n`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}❌ Falha ao buscar modelos:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);

    if (error.message.includes('API_KEY_INVALID') || error.message.includes('400') || error.message.includes('403')) {
      console.error(`${colors.yellow}💡 Dica: Verifique se sua chave de API do Gemini em .env (AI_KEY) é válida.`);
      console.error(`Gere uma chave gratuita em: https://aistudio.google.com/${colors.reset}\n`);
    } else if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('429')) {
      console.error(`${colors.yellow}💡 Dica: Limite de cota excedido para esta chave de API.${colors.reset}\n`);
    }
    process.exit(1);
  }
}

main();
