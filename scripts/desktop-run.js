#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const isWindows = process.platform === 'win32';
const mode = process.argv[2] === 'build' ? 'build' : 'dev';

// Assegura que o Cargo esteja no PATH para este processo
const cargoHome = process.env.CARGO_HOME || path.join(os.homedir(), '.cargo');
const cargoBin = path.join(cargoHome, 'bin');
const env = { ...process.env };

if (fs.existsSync(cargoBin) && (!env.PATH || !env.PATH.includes(cargoBin))) {
  env.PATH = `${cargoBin}${path.delimiter}${env.PATH || ''}`;
}

const frontDir = path.join(__dirname, '..', 'front');
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log(`[Aresta Desktop] Executando Tauri em modo: ${mode}...`);

const child = spawn(npmCmd, ['run', `tauri:${mode}`], {
  cwd: frontDir,
  env,
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  if (code !== 0 && mode === 'build') {
    console.log('\n\x1b[33m[Dica]\x1b[0m Se o comando falhou por falta do Rust/cargo, execute primeiro: \x1b[36mnpm run setup:desktop\x1b[0m\n');
  }
  process.exit(code || 0);
});
