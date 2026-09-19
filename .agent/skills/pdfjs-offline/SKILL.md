---
name: pdfjs-offline
description: >-
  Guia e regras inegociáveis para manutenção, carregamento e empacotamento do PDF.js (pdfjs-dist)
  no monólito Aresta. Garante operação 100% offline, local-first e sem qualquer dependência de CDNs externas.
---

# PDF.js Offline & Local-First Architecture Guide

Esta skill documenta o padrão arquitetural e as regras inegociáveis para uso do **PDF.js (`pdfjs-dist`)** no monólito **Aresta** (Web, PWA, Desktop Tauri e Android APK).

---

## 🚫 Regra Inegociável: Proibição Estrita de CDNs Externas

**NUNCA utilize links de CDNs externas** (tais como `https://cdn.jsdelivr.net/...`, `https://unpkg.com/...` ou `cdnjs`) para o PDF.js em nenhuma circunstância no código-fonte do Aresta.

### Por que CDNs externas quebram o sistema?
1. **Falha Offline / Local-First**: Usuários sem conexão ativa, em redes restritas ou em modo avião não conseguem abrir livros em PDF nem extrair capas.
2. **Ambiente Tauri / WebViews Nativas**: Em Tauri Desktop e Android APK, a WebView pode bloquear requisições a scripts remotos por políticas de CSP ou falta de acesso à rede, gerando o erro fatal:
   ```text
   Falha ao abrir o arquivo: Error: Setting up fake worker failed: "Failed to fetch dynamically imported module: https://cdn.jsdelivr.net/..."
   ```
3. **Falha do Fake Worker**: Quando o PDF.js não consegue instanciar o Web Worker via rede, ele tenta carregar o fallback (`fake worker`) executando um `import()` dinâmico na mesma URL de CDN, travando a thread principal e lançando exceção irreversível.

---

## 🏗️ Padrão Arquitetural Local-First

### 1. Assets Estáticos em `apps/web/public/pdfjs/`
Todos os assets binários do PDF.js são copiados diretamente para a pasta estática:
- `apps/web/public/pdfjs/pdf.worker.min.mjs`
- `apps/web/public/pdfjs/cmaps/`
- `apps/web/public/pdfjs/standard_fonts/`

### 2. Sincronização Automática via `postinstall`
O script `apps/web/scripts/copy-pdfjs-assets.mjs` é acionado automaticamente no `postinstall` (`npm install` / `npm ci` / `nuxt prepare`), mantendo os assets locais sempre atualizados com a versão instalada de `pdfjs-dist`.

### 3. Módulo Centralizador: `apps/web/app/utils/pdfjsSetup.ts`
Toda inicialização e configuração do PDF.js deve ser feita **exclusivamente** através das funções auxiliares exportadas por `pdfjsSetup.ts`:

```typescript
import { setupPdfJs, getPdfDocumentParams } from '~/utils/pdfjsSetup'

// 1. Inicializa o PDF.js com o worker local
const pdfjsLib = await setupPdfJs()

// 2. Cria a loading task com cmaps e standard_fonts locais
const typedArray = new Uint8Array(arrayBuffer)
const loadingTask = pdfjsLib.getDocument(getPdfDocumentParams(typedArray))
const pdfDoc = await loadingTask.promise
```

---

## 🔍 Checklist de Prevenção e Auditoria

Ao criar ou editar qualquer código relacionado a leitura ou manipulação de PDF:

- [ ] Importa `setupPdfJs` e `getPdfDocumentParams` de `~/utils/pdfjsSetup`.
- [ ] Não existe nenhuma menção a `cdn.jsdelivr.net` ou URLs `http`/`https` para `workerSrc`, `cMapUrl` ou `standardFontDataUrl`.
- [ ] `npm test` passa 100% verde incluindo os testes de `pdfjsSetup.test.ts`, `PdfDocumentAdapter.test.ts` e `CoverExtractors.test.ts`.
- [ ] `npm run build` compila o frontend sem avisos de módulos externos não resolvidos.
