#!/usr/bin/env node

const { execSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const mode = process.argv[2] === 'build' ? 'build' : 'dev';

// Assegura que o Cargo (.cargo/bin) esteja presente na variável PATH
const cargoHome = process.env.CARGO_HOME || path.join(os.homedir(), '.cargo');
const cargoBin = path.join(cargoHome, 'bin');

// No Windows, a variável pode ser 'Path' ou 'PATH'
const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') || 'PATH';
const currentPath = process.env[pathKey] || '';

if (fs.existsSync(cargoBin) && !currentPath.includes(cargoBin)) {
  process.env[pathKey] = `${cargoBin}${path.delimiter}${currentPath}`;
}

const frontDir = path.join(__dirname, '..', 'front');

console.log(`\x1b[34m[Aresta Desktop]\x1b[0m Executando Tauri em modo: \x1b[36m${mode}\x1b[0m...`);

try {
  execSync(`npm run tauri:${mode}`, {
    cwd: frontDir,
    stdio: 'inherit',
    env: process.env
  });
} catch (err) {
  if (mode === 'build') {
    console.log('\n\x1b[33m[Dica]\x1b[0m Se a compilação falhou por falta do Rust/cargo, execute primeiro: \x1b[36mnpm run setup:desktop\x1b[0m\n');
  }
  process.exit(1);
}
