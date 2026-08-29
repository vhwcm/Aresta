#!/usr/bin/env node

const { execSync } = require('node:child_process');
const path = require('node:path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const frontDir = path.join(__dirname, '..', 'front');

console.log('\x1b[34m======================================================\x1b[0m');
console.log('\x1b[1m\x1b[34m     Aresta Android - Configuração do Ambiente        \x1b[0m');
console.log('\x1b[34m======================================================\x1b[0m\n');

console.log('\x1b[36m[1/2] Inicializando suporte ao Android no Tauri v2...\x1b[0m');
try {
  execSync(`${npmCmd} run tauri:android:init`, {
    cwd: frontDir,
    stdio: 'inherit'
  });
  console.log('\x1b[32m✓ Suporte Android inicializado com sucesso!\x1b[0m');
} catch (e) {
  console.log('\x1b[33m• Projeto Android já existente ou aguardando dependências do Android Studio/NDK.\x1b[0m');
}

console.log('\n\x1b[36m[2/2] Para compilar o APK Android:\x1b[0m');
console.log('  \x1b[32mnpm run android:apk\x1b[0m (gera o arquivo .apk)');
console.log('  \x1b[32mnpm run android:open\x1b[0m (abre o projeto no Android Studio)\n');
