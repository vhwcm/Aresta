#!/usr/bin/env node

const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const isWindows = process.platform === 'win32';

// Cores ANSI
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const ROOT_DIR = __dirname;
const children = [];

console.log(`${colors.blue}======================================================${colors.reset}`);
console.log(`${colors.blue}   Iniciando Aresta (Backend, Frontend e Conversor)   ${colors.reset}`);
console.log(`${colors.blue}======================================================${colors.reset}\n`);

function killProcess(child) {
  if (!child || !child.pid) return;
  try {
    if (isWindows) {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {}
  }
}

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n${colors.yellow}[Aresta] Encerrando serviços (Conversor, Frontend e Backend)...${colors.reset}`);
  for (const child of children) {
    killProcess(child);
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  for (const child of children) {
    killProcess(child);
  }
});

// 1. Conversor PDF -> EPUB
const pdf2epubDir = path.join(ROOT_DIR, 'pdf2epub');
let uvicornCmd = null;
let uvicornArgs = [];

const possibleUvicornPaths = isWindows
  ? [
      path.join(pdf2epubDir, '.venv', 'Scripts', 'uvicorn.exe'),
      path.join(pdf2epubDir, 'venv', 'Scripts', 'uvicorn.exe'),
      path.join(pdf2epubDir, '.venv', 'Scripts', 'python.exe'),
      path.join(pdf2epubDir, 'venv', 'Scripts', 'python.exe')
    ]
  : [
      path.join(pdf2epubDir, '.venv', 'bin', 'uvicorn'),
      path.join(pdf2epubDir, 'venv', 'bin', 'uvicorn'),
      path.join(pdf2epubDir, '.venv', 'bin', 'python'),
      path.join(pdf2epubDir, 'venv', 'bin', 'python')
    ];

for (const p of possibleUvicornPaths) {
  if (fs.existsSync(p)) {
    if (p.endsWith('python.exe') || p.endsWith('/python')) {
      uvicornCmd = p;
      uvicornArgs = ['-m', 'uvicorn', 'pdf2epub.api.server:app', '--host', '0.0.0.0', '--port', '8000'];
    } else {
      uvicornCmd = p;
      uvicornArgs = ['pdf2epub.api.server:app', '--host', '0.0.0.0', '--port', '8000'];
    }
    break;
  }
}

if (uvicornCmd) {
  console.log(`${colors.green}[Conversor]${colors.reset} Iniciando microsserviço Python em pdf2epub (porta 8000)...`);
  const convChild = spawn(uvicornCmd, uvicornArgs, {
    cwd: pdf2epubDir,
    stdio: 'inherit',
    detached: !isWindows,
    env: {
      ...process.env,
      PYTHONPATH: path.join(pdf2epubDir, 'src')
    }
  });
  children.push(convChild);
} else {
  console.log(`${colors.yellow}[Conversor]${colors.reset} Ambiente virtual Python não encontrado em pdf2epub/.venv. Pulando conversor.`);
}

// 2. Backend
const backDir = path.join(ROOT_DIR, 'aresta-back-node');
console.log(`${colors.green}[Backend]${colors.reset} Iniciando servidor Express em aresta-back-node (porta 7070)...`);
const backChild = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: backDir,
  stdio: 'inherit',
  detached: !isWindows,
  shell: isWindows
});
children.push(backChild);

// 3. Frontend
const frontDir = path.join(ROOT_DIR, 'front');
console.log(`${colors.green}[Frontend]${colors.reset} Iniciando Nuxt dev server em front (porta 3000)...`);
const frontChild = spawn(isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'], {
  cwd: frontDir,
  stdio: 'inherit',
  detached: !isWindows,
  shell: isWindows,
  env: {
    ...process.env,
    NUXT_TELEMETRY_DISABLED: '1',
    NITRO_HOST: '0.0.0.0',
    HOST: '0.0.0.0',
    PORT: '3000'
  }
});
children.push(frontChild);

console.log(`\n${colors.green}✓ Todos os serviços foram disparados!${colors.reset}`);
console.log(`${colors.yellow}Acesse:${colors.reset}`);
console.log(`  • ${colors.blue}Frontend:${colors.reset}     http://localhost:3000`);
console.log(`  • ${colors.blue}Conversor:${colors.reset}    http://localhost:8000/docs`);
console.log(`  • ${colors.blue}Backend API:${colors.reset}  http://localhost:7070/api/health`);
console.log(`  • ${colors.blue}Swagger UI:${colors.reset}   http://localhost:7070/api-docs`);
console.log(`${colors.yellow}Pressione Ctrl+C a qualquer momento para interromper todos.${colors.reset}\n`);
