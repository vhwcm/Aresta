#!/usr/bin/env node

const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// ANSI Colors
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

console.log(`${colors.blue}======================================================${colors.reset}`);
console.log(`${colors.bold}${colors.blue}           Aresta - Configuração do Ambiente          ${colors.reset}`);
console.log(`${colors.blue}======================================================${colors.reset}\n`);

// 1. Configuração de arquivos de ambiente (.env)
console.log(`${colors.cyan}[1/5] Verificando arquivos de ambiente (.env)...${colors.reset}`);

function copyEnvIfNotExists(exampleFile, targetFile) {
  if (fs.existsSync(targetFile)) {
    console.log(`  ${colors.yellow}• ${path.relative(ROOT_DIR, targetFile)} já existe (mantido).${colors.reset}`);
    return;
  }

  if (fs.existsSync(exampleFile)) {
    fs.copyFileSync(exampleFile, targetFile);
    console.log(`  ${colors.green}✓ ${path.relative(ROOT_DIR, targetFile)} criado a partir de ${path.basename(exampleFile)}.${colors.reset}`);
  } else {
    console.log(`  ${colors.yellow}⚠ Arquivo modelo ${path.relative(ROOT_DIR, exampleFile)} não encontrado.${colors.reset}`);
  }
}

// Raiz: prioriza .env.exemple ou .env.example
const rootExample = fs.existsSync(path.join(ROOT_DIR, '.env.exemple'))
  ? path.join(ROOT_DIR, '.env.exemple')
  : path.join(ROOT_DIR, '.env.example');

copyEnvIfNotExists(rootExample, path.join(ROOT_DIR, '.env'));

// Backend: aresta-back-node/.env
const backExample = path.join(ROOT_DIR, 'aresta-back-node', '.env.example');
const backEnv = path.join(ROOT_DIR, 'aresta-back-node', '.env');
copyEnvIfNotExists(backExample, backEnv);

// 2. Instalação das dependências raiz
console.log(`\n${colors.cyan}[2/5] Instalando dependências da raiz...${colors.reset}`);
try {
  execSync(`${npmCmd} install`, {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });
  console.log(`  ${colors.green}✓ Dependências da raiz instaladas com sucesso.${colors.reset}`);
} catch (err) {
  console.error(`  ${colors.red}✗ Falha ao instalar dependências da raiz.${colors.reset}`);
}

// 3. Instalação das dependências do Backend (aresta-back-node)
const backDir = path.join(ROOT_DIR, 'aresta-back-node');
console.log(`\n${colors.cyan}[3/5] Instalando dependências do Backend (aresta-back-node)...${colors.reset}`);
try {
  execSync(`${npmCmd} install`, {
    cwd: backDir,
    stdio: 'inherit'
  });
  console.log(`  ${colors.green}✓ Dependências do Backend instaladas com sucesso.${colors.reset}`);

  // Gerar cliente Prisma se existir
  if (fs.existsSync(path.join(backDir, 'prisma'))) {
    console.log(`  ${colors.cyan}→ Gerando Prisma Client...${colors.reset}`);
    try {
      execSync(`${npmCmd} run prisma:generate`, {
        cwd: backDir,
        stdio: 'inherit'
      });
      console.log(`  ${colors.green}✓ Prisma Client gerado com sucesso.${colors.reset}`);
    } catch {
      console.log(`  ${colors.yellow}⚠ Não foi possível regenerar o Prisma Client agora (provavelmente o servidor backend já está rodando e bloqueando o arquivo).${colors.reset}`);
    }
  }
} catch (err) {
  console.error(`  ${colors.red}✗ Falha ao instalar dependências do Backend.${colors.reset}`);
}

// 4. Configuração do Microsserviço Conversor (pdf2epub com Python venv)
console.log(`\n${colors.cyan}[4/5] Configurando microsserviço Conversor (pdf2epub)...${colors.reset}`);
const pdf2epubDir = path.join(ROOT_DIR, 'pdf2epub');
const venvDir = path.join(pdf2epubDir, '.venv');
const reqFile = path.join(pdf2epubDir, 'requirements.txt');

function getPythonCommand() {
  const candidates = isWindows ? ['python', 'py -3', 'py', 'python3'] : ['python3', 'python'];
  for (const cmd of candidates) {
    try {
      const out = execSync(`${cmd} --version`, { stdio: 'pipe', encoding: 'utf-8' }).trim();
      if (out.toLowerCase().startsWith('python 3')) {
        return cmd;
      }
    } catch {
      // tenta o próximo candidato
    }
  }
  return null;
}

const pythonCmd = getPythonCommand();
if (!pythonCmd) {
  console.log(`  ${colors.yellow}⚠ Python 3 não foi detectado no sistema.${colors.reset}`);
  console.log(`  ${colors.yellow}  O microsserviço de conversão PDF->EPUB (pdf2epub) requer Python >= 3.10.${colors.reset}`);
  console.log(`  ${colors.yellow}  Para utilizá-lo, instale o Python (https://www.python.org/downloads/) marcando "Add to PATH" e execute '${colors.cyan}npm run setup${colors.yellow}' novamente.${colors.reset}`);
} else {
  try {
    if (!fs.existsSync(venvDir)) {
      console.log(`  ${colors.cyan}→ Criando ambiente virtual Python (.venv) usando '${pythonCmd}'...${colors.reset}`);
      execSync(`${pythonCmd} -m venv .venv`, { cwd: pdf2epubDir, stdio: 'inherit' });
      console.log(`  ${colors.green}✓ Ambiente virtual criado em pdf2epub/.venv.${colors.reset}`);
    } else {
      console.log(`  ${colors.yellow}• Ambiente virtual pdf2epub/.venv já existe (mantido).${colors.reset}`);
    }

    const pipCmd = isWindows
      ? path.join(venvDir, 'Scripts', 'pip.exe')
      : path.join(venvDir, 'bin', 'pip');

    if (fs.existsSync(pipCmd) && fs.existsSync(reqFile)) {
      console.log(`  ${colors.cyan}→ Instalando dependências Python do requirements.txt...${colors.reset}`);
      execSync(`"${pipCmd}" install -r "${reqFile}"`, { cwd: pdf2epubDir, stdio: 'inherit' });
      console.log(`  ${colors.green}✓ Dependências do Conversor instaladas com sucesso.${colors.reset}`);
    }
  } catch (err) {
    console.error(`  ${colors.red}✗ Falha ao configurar ambiente Python do Conversor: ${err.message || err}${colors.reset}`);
  }
}

// 5. Instalação das dependências do Frontend (front)
const frontDir = path.join(ROOT_DIR, 'front');
console.log(`\n${colors.cyan}[5/5] Instalando dependências do Frontend (front)...${colors.reset}`);
try {
  execSync(`${npmCmd} install`, {
    cwd: frontDir,
    stdio: 'inherit'
  });
  console.log(`  ${colors.green}✓ Dependências do Frontend instaladas com sucesso.${colors.reset}`);
} catch (err) {
  console.error(`  ${colors.red}✗ Falha ao instalar dependências do Frontend.${colors.reset}`);
}

console.log(`\n${colors.bold}${colors.green}======================================================${colors.reset}`);
console.log(`${colors.bold}${colors.green}  ✓ Setup concluído com sucesso!                      ${colors.reset}`);
console.log(`${colors.green}======================================================${colors.reset}\n`);
console.log(`${colors.yellow}Para iniciar a aplicação, execute:${colors.reset}`);
console.log(`  ${colors.cyan}npm start${colors.reset}\n`);
