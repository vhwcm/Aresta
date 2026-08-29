# Guia Completo: Setup e Geração de APK Android (Aresta Mobile)

Este documento descreve os pré-requisitos, configuração de ambiente e comandos necessários para compilar e gerar o arquivo **APK** do **Aresta** para dispositivos Android utilizando o motor híbrido **Tauri v2 + Nuxt 3/4 + Vue 3**.

---

## 1. Visão Geral da Arquitetura de Build

```
+-------------------------------------------------------------------+
|                        FRONTEND WEB (Nuxt / Vue)                  |
|          - Leitor EPUB/PDF, Dexie.js (IndexedDB), Pinia           |
+---------------------------------+---------------------------------+
                                  |
                        tauri.conf.json & plugins
                                  |
                                  v
+-------------------------------------------------------------------+
|                        TAURI MOBILE v2 (Rust)                     |
|        - lib.rs / Mobile Targets (aarch64, armv7, x86_64)         |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                     ANDROID BUILD TOOLS / GRADLE                  |
|    - Java OpenJDK 17 + Android SDK (Platform 34+) + NDK           |
+---------------------------------+---------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                           SAÍDA FINAL                             |
|            app-universal-release.apk / app-arm64-v8a.apk          |
+-------------------------------------------------------------------+
```

---

## 2. Pré-Requisitos do Sistema

Para compilar o APK, sua máquina deve possuir as seguintes ferramentas instaladas:

| Ferramenta | Versão Recomendada | Função |
| :--- | :--- | :--- |
| **Node.js** | 20+ ou 22+ | Execução do Nuxt e scripts de automação |
| **Rust & Cargo** | 1.80+ | Compilador nativo e Tauri CLI |
| **Android Studio** | Versão recente (ex: Koala / Ladybug) | SDK Manager, Emuladores e Gradle |
| **Android SDK Platform** | API 34 ou 35 | Bibliotecas base do Android |
| **Android NDK** | 26.x ou 27.x | Compilação C/C++ e bindings do Rust |
| **Java JDK** | OpenJDK 17 ou JBR do Android Studio | Compilação do projeto Gradle |

---

## 3. Configuração de Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis no seu sistema operacional (ou deixe o script automático detectá-las):

### Windows (PowerShell / Variáveis de Sistema)
- `ANDROID_HOME`: `C:\Users\<SEU_USUARIO>\AppData\Local\Android\Sdk`
- `NDK_HOME`: `%ANDROID_HOME%\ndk\<VERSAO_NDK>` (ex: `26.1.10909125`)
- `JAVA_HOME`: `C:\Program Files\Android\Android Studio\jbr` (ou caminho do OpenJDK 17)
- `PATH`: Adicione `%ANDROID_HOME%\platform-tools`, `%ANDROID_HOME%\cmdline-tools\latest\bin` e `%CARGO_HOME%\bin`.

---

## 4. Scripts Automatizados do Repositório

Adicionamos rotinas de detecção e execução direta no `package.json` raiz:

### 4.1. Diagnóstico e Instalação de Targets
Para verificar se todas as dependências estão prontas e instalar os targets Rust do Android (`aarch64`, `armv7`, `x86_64`):
```bash
npm run setup:android
# ou
npm run android:setup
```

### 4.2. Geração do APK de Produção
Para compilar a interface estática do Nuxt e gerar os binários `.apk`:
```bash
npm run android:apk
# ou
npm run android:build
```

### 4.3. Execução em Modo de Desenvolvimento / Debug
Para rodar diretamente no celular conectado via USB ou no emulador Android ativo com Hot-Reload:
```bash
npm run android:dev
```

### 4.4. Abrir no Android Studio
Para abrir a pasta nativa gerada pelo Gradle e inspecionar no Android Studio:
```bash
npm run android:open
```

---

## 5. Localização dos APKs Gerados

Após a execução bem-sucedida de `npm run android:apk`, os arquivos de instalação estarão localizados em:

```
front/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
```
*(ou divididos por arquitetura dentro de `outputs/apk/.../release/`)*

---

## 6. Como Instalar no Celular Android

1. **Via Cabo USB (ADB)**:
   - Ative a **Depuração USB** nas *Opções do Desenvolvedor* do celular.
   - Conecte o cabo e rode:
     ```bash
     adb install front/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk
     ```

2. **Via Envio Direto**:
   - Envie o arquivo `.apk` para o celular (via Google Drive, WhatsApp, cabo ou download direto).
   - No celular, abra o arquivo e permita a instalação de aplicativos de fontes desconhecidas.

---

## 7. Solução de Problemas Comuns (Troubleshooting)

### Erro: `cargo-android not found` ou `targets missing`
Execute:
```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

### Erro: `NDK is not installed or NDK_HOME not set`
Abra o **Android Studio** -> **Settings** -> **Languages & Frameworks** -> **Android SDK** -> **SDK Tools**. Marque:
- `NDK (Side by side)`
- `Android SDK Command-line Tools (latest)`
- `CMake`
Clique em **Apply**.

### Erro no build estático do Nuxt (`nuxt generate`)
Certifique-se de que todas as dependências do frontend estão instaladas e sem conflito:
```bash
cd front
npm install
npm run generate
```

---

## 8. Geração e Publicação Automática via GitHub Actions (CI/CD)

O repositório possui uma automação configurada em [`.github/workflows/release.yml`](file:///.github/workflows/release.yml). Você não precisa compilar nada no seu computador!

### Como disparar uma nova Release com APK:

#### Opção A: Criando uma Tag no Git
```bash
git tag v1.0.0
git push origin v1.0.0
```

#### Opção B: Pelo painel do GitHub
1. Vá na aba **Actions** do seu repositório no GitHub.
2. Selecione **"Release Android APK & Desktop"** na barra lateral.
3. Clique em **"Run workflow"** e escolha a versão (ex: `v1.0.0`).

> O GitHub Actions irá compilar o APK em servidores Linux na nuvem e anexá-lo automaticamente na aba **Releases** do repositório para download direto!

