#!/usr/bin/env node

const { execSync } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const action = process.argv[2] || 'dev';
const frontDir = path.join(__dirname, '..', 'front');

// Assegura Cargo no PATH
const cargoHome = process.env.CARGO_HOME || path.join(os.homedir(), '.cargo');
const cargoBin = path.join(cargoHome, 'bin');
const pathKey = Object.keys(process.env).find((k) => k.toLowerCase() === 'path') || 'PATH';
let currentPath = process.env[pathKey] || '';
if (fs.existsSync(cargoBin) && !currentPath.includes(cargoBin)) {
  currentPath = `${cargoBin}${path.delimiter}${currentPath}`;
}

// Auto-detecta JDK compatível (JDK 17/21) evitando incompatibilidade do JBR 25 com Gradle
function resolveJavaHome() {
  const customJava = process.env.JAVA_HOME;
  if (customJava && fs.existsSync(customJava)) {
    // Se o JAVA_HOME atual não for o JBR do Android Studio (que usa Java 25 não suportado pelo Gradle), mantemos
    if (!customJava.toLowerCase().includes('android studio\\jbr') && !customJava.toLowerCase().includes('android studio/jbr')) {
      return customJava;
    }
  }

  const candidateDirs = [
    'C:\\Program Files\\Microsoft',
    'C:\\Program Files\\Eclipse Adoptium',
    'C:\\Program Files\\Java',
    path.join(os.homedir(), '.jdks')
  ];

  for (const parentDir of candidateDirs) {
    if (!fs.existsSync(parentDir)) continue;
    try {
      const subdirs = fs.readdirSync(parentDir);
      // Procura primeiro JDK 17 ou 21
      const preferred = subdirs.find((d) => /jdk-?(17|21)/i.test(d));
      if (preferred) {
        return path.join(parentDir, preferred);
      }
      const anyJdk = subdirs.find((d) => /^jdk/i.test(d));
      if (anyJdk) {
        return path.join(parentDir, anyJdk);
      }
    } catch (_) {}
  }

  return null;
}

const javaHome = resolveJavaHome();
if (javaHome) {
  process.env.JAVA_HOME = javaHome;
  const javaBin = path.join(javaHome, 'bin');
  if (fs.existsSync(javaBin) && !currentPath.includes(javaBin)) {
    currentPath = `${javaBin}${path.delimiter}${currentPath}`;
  }
  console.log(`\x1b[35m[Aresta Android]\x1b[0m Usando JAVA_HOME: \x1b[33m${javaHome}\x1b[0m`);
}

// Auto-detecta Android SDK
const defaultAndroidSdk = path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
if (!process.env.ANDROID_HOME && fs.existsSync(defaultAndroidSdk)) {
  process.env.ANDROID_HOME = defaultAndroidSdk;
}

process.env[pathKey] = currentPath;

let tauriCmd = 'tauri:android:dev';
if (action === 'build' || action === 'apk') {
  tauriCmd = 'tauri:android:build';
} else if (action === 'open') {
  tauriCmd = 'tauri:android:open';
}

console.log(`\x1b[34m[Aresta Android]\x1b[0m Executando: \x1b[36mnpm run ${tauriCmd}\x1b[0m...`);

try {
  execSync(`npm run ${tauriCmd}`, {
    cwd: frontDir,
    stdio: 'inherit',
    env: process.env
  });
} catch (err) {
  process.exit(1);
}
