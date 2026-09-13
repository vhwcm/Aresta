#!/usr/bin/env node

/**
 * Aresta Monolith — Environment Variable Manager
 * 
 * Permite definir, consultar e listar variáveis de ambiente no .env raiz.
 *
 * Sintaxe de uso:
 *   npm run set-env [VARIAVEL] [VALOR]
 *   npm run set-env [VARIAVEL]=[VALOR]
 *   npm run set-env --get [VARIAVEL]
 *   npm run set-env --list
 * 
 * O monólito usa um único arquivo de ambiente na raiz.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const TARGETS = [
  {
    id: 'root',
    name: 'Raiz (.env)',
    envPath: path.join(ROOT_DIR, '.env'),
    examplePath: path.join(ROOT_DIR, '.env.example')
  }
];

function maskValue(key, value) {
  if (!value) return '(vazio)';
  if (key.includes('URL') || key.includes('URI')) {
    return value;
  }
  const sensitiveRegex = /KEY|SECRET|PASSWORD|TOKEN|PRIVATE/i;
  if (!sensitiveRegex.test(key)) {
    return value;
  }
  const str = String(value);
  if (str.length <= 8) {
    return '********';
  }
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  return lines.map((line, idx) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      let val = match[2].trim();
      // Remove outer quotes if present for parsed value
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return {
        type: 'var',
        key: match[1],
        rawValue: match[2],
        value: val,
        rawLine: line,
        lineIndex: idx
      };
    }
    return {
      type: 'other',
      rawLine: line,
      lineIndex: idx
    };
  });
}

function formatEnvValue(value) {
  if (typeof value !== 'string') value = String(value);

  // If already enclosed in quotes, strip them first
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  // Booleans and pure numbers can stay unquoted
  if (value === 'true' || value === 'false' || /^-?\d+(\.\d+)?$/.test(value)) {
    return value;
  }

  // Quote strings with spaces, special chars or standard values
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function updateEnvFile(target, key, value) {
  const { envPath, examplePath, name } = target;

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log(`ℹ Arquivo criado a partir do template: ${name}`);
    } else {
      fs.writeFileSync(envPath, '', 'utf-8');
      console.log(`ℹ Arquivo criado vazio: ${name}`);
    }
  }

  const lines = parseEnvFile(envPath);
  const formattedVal = formatEnvValue(value);
  let updated = false;
  let previousVal = null;

  const newLines = lines.map(entry => {
    if (entry.type === 'var' && entry.key === key) {
      updated = true;
      previousVal = entry.value;
      return `${key}=${formattedVal}`;
    }
    return entry.rawLine;
  });

  if (!updated) {
    // Append to the end
    // Ensure last line has a newline
    if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
      newLines.push('');
    }
    newLines.push(`${key}=${formattedVal}`);
  }

  fs.writeFileSync(envPath, newLines.join('\n') + '\n', 'utf-8');
  return { updated, previousVal };
}

function getEnvVariable(key) {
  console.log(`\n🔍 Consultando variável: \x1b[36m${key}\x1b[0m\n`);
  let foundAny = false;

  for (const target of TARGETS) {
    if (!fs.existsSync(target.envPath)) continue;
    const lines = parseEnvFile(target.envPath);
    const entry = lines.find(l => l.type === 'var' && l.key === key);
    if (entry) {
      foundAny = true;
      console.log(`  \x1b[32m✔\x1b[0m \x1b[1m${target.name}\x1b[0m: ${key}=${maskValue(key, entry.value)}`);
    }
  }

  if (!foundAny) {
    console.log(`  \x1b[33m⚠\x1b[0m Variável "${key}" não foi encontrada em nenhum arquivo .env ativo.`);
  }
  console.log('');
}

function listEnvVariables() {
  console.log(`\n📋 Variáveis configuradas no Monólito Aresta:\n`);
  for (const target of TARGETS) {
    console.log(`\x1b[1m\x1b[34m[${target.name}]\x1b[0m - ${path.relative(ROOT_DIR, target.envPath)}`);
    if (!fs.existsSync(target.envPath)) {
      console.log(`  (arquivo inexistente)\n`);
      continue;
    }
    const lines = parseEnvFile(target.envPath);
    const vars = lines.filter(l => l.type === 'var');
    if (vars.length === 0) {
      console.log(`  (nenhuma variável definida)\n`);
    } else {
      for (const v of vars) {
        console.log(`  \x1b[36m${v.key.padEnd(28)}\x1b[0m = ${maskValue(v.key, v.value)}`);
      }
      console.log('');
    }
  }
}

function showHelp() {
  console.log(`
\x1b[1m\x1b[35mAresta Monolith — Gerenciador de .env\x1b[0m

\x1b[1mSintaxe:\x1b[0m
  npm run set-env [VARIAVEL] [VALOR]
  npm run set-env [VARIAVEL]=[VALOR]

\x1b[1mExemplos:\x1b[0m
  npm run set-env GEMINI_API_KEY AIzaSyD...
  npm run set-env PORT 3005
  npm run set-env NUXT_PUBLIC_API_URL http://localhost:3005
  npm run set-env USE_MOCK false

\x1b[1mConsultar e Listar:\x1b[0m
  npm run set-env --get [VARIAVEL]     Consultar valor atual
  npm run set-env --list               Listar todas as variáveis configuradas
`);
}

function main() {
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (rawArgs.includes('--list') || rawArgs.includes('-l')) {
    listEnvVariables();
    process.exit(0);
  }

  const filteredArgs = [];

  for (const arg of rawArgs) {
    if (!['--api', '-a', '--web', '-w', '--root', '-r', '--all'].includes(arg) && !arg.startsWith('--target=')) {
      filteredArgs.push(arg);
    }
  }

  if (filteredArgs[0] === '--get' || filteredArgs[0] === '-g') {
    const key = filteredArgs[1];
    if (!key) {
      console.error('\x1b[31mErro:\x1b[0m Especifique a variável para consultar. Ex: npm run set-env --get GEMINI_API_KEY');
      process.exit(1);
    }
    getEnvVariable(key);
    process.exit(0);
  }

  // Positional key and value
  let key = '';
  let value = '';

  const firstArg = filteredArgs[0];
  if (firstArg.includes('=')) {
    const splitIdx = firstArg.indexOf('=');
    key = firstArg.substring(0, splitIdx).trim();
    value = firstArg.substring(splitIdx + 1).trim();
    if (filteredArgs.length > 1) {
      value = [value, ...filteredArgs.slice(1)].join(' ');
    }
  } else {
    key = firstArg.trim();
    value = filteredArgs.slice(1).join(' ').trim();
  }

  if (!key) {
    console.error('\x1b[31mErro:\x1b[0m O nome da variável é obrigatório.');
    showHelp();
    process.exit(1);
  }

  const selectedTargets = TARGETS;

  console.log(`\n⚙  Atualizando \x1b[36m${key}\x1b[0m = \x1b[32m${maskValue(key, value)}\x1b[0m\n`);

  for (const target of selectedTargets) {
    const { updated, previousVal } = updateEnvFile(target, key, value);
    if (updated) {
      const prevMasked = previousVal !== null ? ` (anterior: ${maskValue(key, previousVal)})` : '';
      console.log(`  \x1b[32m✔\x1b[0m [${target.name}] atualizado com sucesso!${prevMasked}`);
    } else {
      console.log(`  \x1b[32m✔\x1b[0m [${target.name}] nova variável adicionada!`);
    }
  }
  console.log('');
}

if (require.main === module) {
  main();
}

module.exports = {
  maskValue,
  parseEnvFile,
  formatEnvValue,
  updateEnvFile,
  TARGETS
};
