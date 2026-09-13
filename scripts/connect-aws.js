#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

// Diretório onde a chave SSH foi armazenada
const keyDir = path.join(os.homedir(), '.aresta', 'chave-ssh-aws');
const defaultKeyName = 'aresta-key.pem';
const alternativeKeyName = 'instancia-aresta-aws.pem';

let keyPath = path.join(keyDir, defaultKeyName);
if (!fs.existsSync(keyPath)) {
  const altPath = path.join(keyDir, alternativeKeyName);
  if (fs.existsSync(altPath)) {
    keyPath = altPath;
  }
}

if (!fs.existsSync(keyPath)) {
  console.error(`\x1b[31m[Erro]\x1b[0m Chave SSH não encontrada em: ${keyPath}`);
  console.error(`\x1b[33m[Dica]\x1b[0m Coloque o arquivo .pem em ~/.aresta/chave-ssh-aws/aresta-key.pem\n`);
  process.exit(1);
}

// Host padrão da instância EC2 (ou passado por argumento / env)
const host = process.argv[2] || process.env.AWS_EC2_HOST || '18.228.190.2';
const user = process.env.AWS_EC2_USER || 'ubuntu';

console.log(`\x1b[34m[Aresta AWS]\x1b[0m Conectando via SSH à instância EC2...`);
console.log(`\x1b[36m-> Host:\x1b[0m ${user}@${host}`);
console.log(`\x1b[36m-> Chave:\x1b[0m ${keyPath}\n`);

const sshArgs = [
  '-i',
  keyPath,
  '-o',
  'StrictHostKeyChecking=accept-new',
  `${user}@${host}`
];

const child = spawn('ssh', sshArgs, {
  stdio: 'inherit',
  shell: false
});

child.on('error', (err) => {
  console.error(`\x1b[31m[Erro ao iniciar SSH]:\x1b[0m ${err.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`\x1b[33m\n[Aresta AWS]\x1b[0m Conexão encerrada com código ${code}.`);
  }
  process.exit(code || 0);
});
