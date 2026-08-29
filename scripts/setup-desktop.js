#!/usr/bin/env node

const { execSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';

// Adiciona diretório padrão do Cargo ao PATH se já existir no disco
const cargoHome = process.env.CARGO_HOME || path.join(os.homedir(), '.cargo');
const cargoBin = path.join(cargoHome, 'bin');
if (fs.existsSync(cargoBin) && !process.env.PATH.includes(cargoBin)) {
  process.env.PATH = `${cargoBin}${path.delimiter}${process.env.PATH}`;
}

console.log(`${colors.blue}======================================================${colors.reset}`);
console.log(`${colors.bold}${colors.blue}     Aresta Desktop - Instalação de Dependências      ${colors.reset}`);
console.log(`${colors.blue}======================================================${colors.reset}\n`);

function isCommandAvailable(cmd) {
  try {
    const res = spawnSync(isWindows ? `${cmd}.exe` : cmd, ['--version'], {
      shell: true,
      stdio: 'pipe',
      env: process.env
    });
    return res.status === 0;
  } catch {
    return false;
  }
}

// 1. Verificar e instalar Rust (cargo / rustc)
console.log(`${colors.cyan}[1/3] Verificando compilador Rust (cargo)...${colors.reset}`);

if (isCommandAvailable('cargo')) {
  try {
    const version = execSync('cargo --version', { env: process.env }).toString().trim();
    console.log(`  ${colors.green}✓ Rust instalado com sucesso: ${version}${colors.reset}`);
  } catch (e) {
    console.log(`  ${colors.green}✓ Cargo detectado.${colors.reset}`);
  }
} else {
  console.log(`  ${colors.yellow}• Rust não encontrado. Iniciando download e instalação automática...${colors.reset}`);

  if (isWindows) {
    try {
      console.log(`  ${colors.cyan}• Instalando Rust via winget...${colors.reset}`);
      execSync('winget install --id Rustlang.Rustup -e --accept-source-agreements --accept-package-agreements', {
        stdio: 'inherit'
      });
      console.log(`  ${colors.green}✓ Rustup instalado com sucesso!${colors.reset}`);
    } catch (err) {
      console.log(`  ${colors.yellow}⚠ Tentando instalação alternativa via PowerShell...${colors.reset}`);
      try {
        const psScript = `
          $rustupInit = "$env:TEMP\\rustup-init.exe"
          Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile $rustupInit
          Start-Process -FilePath $rustupInit -ArgumentList "-y" -Wait
        `;
        execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
        console.log(`  ${colors.green}✓ Rustup instalado com sucesso via script direto!${colors.reset}`);
      } catch (err2) {
        console.error(`  ${colors.red}✗ Falha ao instalar Rust automaticamente. Por favor, baixe em: https://rustup.rs/${colors.reset}`);
      }
    }
  } else if (isLinux) {
    try {
      console.log(`  ${colors.cyan}• Instalando bibliotecas nativas de sistema (webkit2gtk, build-essential)...${colors.reset}`);
      try {
        execSync('sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev', {
          stdio: 'inherit'
        });
      } catch (e) {
        console.log(`  ${colors.yellow}• Não foi possível rodar apt com sudo automaticamente.${colors.reset}`);
      }

      console.log(`  ${colors.cyan}• Instalando Rust via rustup.rs...${colors.reset}`);
      execSync("curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y", { stdio: 'inherit' });
      console.log(`  ${colors.green}✓ Rust instalado com sucesso!${colors.reset}`);
    } catch (err) {
      console.error(`  ${colors.red}✗ Falha ao instalar Rust no Linux. Por favor, execute: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh${colors.reset}`);
    }
  } else if (isMac) {
    try {
      execSync("curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y", { stdio: 'inherit' });
      console.log(`  ${colors.green}✓ Rust instalado com sucesso!${colors.reset}`);
    } catch (err) {
      console.error(`  ${colors.red}✗ Falha ao instalar Rust no macOS.${colors.reset}`);
    }
  }
}

// 2. Verificar dependências npm do Desktop no frontend
console.log(`\n${colors.cyan}[2/3] Verificando dependências do Tauri v2 no frontend...${colors.reset}`);
const frontDir = path.join(__dirname, '..', 'front');
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

try {
  execSync(`${npmCmd} install`, {
    cwd: frontDir,
    stdio: 'inherit'
  });
  console.log(`  ${colors.green}✓ Dependências do frontend e Tauri CLI atualizadas!${colors.reset}`);
} catch (e) {
  console.error(`  ${colors.red}✗ Falha ao atualizar dependências do frontend.${colors.reset}`);
}

// 3. Finalização e Próximos Passos
console.log(`\n${colors.cyan}[3/3] Validação concluída!${colors.reset}`);
console.log(`\n${colors.bold}${colors.green}🎉 Ambiente Desktop configurado com sucesso!${colors.reset}`);
console.log(`\n${colors.yellow}Dica importante:${colors.reset} Se o Rust foi instalado agora pela primeira vez, feche e reabra este terminal para carregar as variáveis de ambiente.\n`);
console.log(`Para iniciar o app Desktop em desenvolvimento:`);
console.log(`  ${colors.cyan}npm run desktop:dev${colors.reset}\n`);
console.log(`Para compilar os instaladores (.exe/.msi no Windows ou .AppImage/.deb no Linux):`);
console.log(`  ${colors.cyan}npm run desktop:build${colors.reset}\n`);
