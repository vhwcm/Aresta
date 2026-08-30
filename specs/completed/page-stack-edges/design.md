# Design Técnico: Pilha de Páginas Laterais & Efeitos de Livro Físico (Page Stack Edges)

## 1. Visão Geral da Arquitetura
A funcionalidade de **Page Stack Edges** adiciona camadas visuais dinâmicas nas extremidades do livro aberto no leitor (`PageCurlCanvas.vue`), expressando fisicamente o volume de folhas lidas (lado esquerdo) e folhas restantes a ler (lado direito).

A funcionalidade se integra à configuração `pageCreaseEnabled` (renomeada na UI para "Efeitos de Livro Físico: Vinco e Pilha de Páginas") e possui amarração direta com `pageAnimationEnabled` (virada de página 3D), tanto na interface quanto nas regras de negócio e validações da API.

## 2. Diagrama Visual de Fluxo
Consulte o diagrama detalhado em: `diagrams/page-stack-flow.txt`

## 3. Contratos de Dados, Schemas e Regras de Negócio

### 3.1. Schemas Zod (`aresta-back-node/src/schemas/userSettings.schema.ts`)
Validação com refinamento para impedir combinações inválidas:
```typescript
export const updateUserSettingsSchema = z
  .object({
    pageAnimationEnabled: z.boolean().default(true).optional(),
    pageCreaseEnabled: z.boolean().default(true).optional(),
    language: z.string().default('pt-BR').optional(),
    nativeLanguage: z.enum(['pt-BR', 'pt', 'en', 'es']).default('pt-BR').optional(),
    targetTranslationLanguage: z.enum(['pt-BR', 'pt', 'en', 'es']).default('en').optional(),
    epubFontSize: z.number().int().min(10).max(48).default(18).optional(),
    epubFontFamily: z.enum(['newsreader', 'literata', 'lora', 'merriweather', 'inter']).default('newsreader').optional(),
    themeMode: z.enum(['dark', 'light', 'sepia']).default('dark').optional(),
    desktopHomeGraphOpen: z.boolean().default(false).optional(),
    desktopReaderGraphOpen: z.boolean().default(false).optional(),
  })
  .refine(
    (data) => {
      if (data.pageAnimationEnabled === false && data.pageCreaseEnabled === true) {
        return false;
      }
      return true;
    },
    {
      message: 'Os efeitos de livro físico (vinco/pilha) não podem ser ativados quando a animação 3D de páginas está desativada.',
      path: ['pageCreaseEnabled'],
    }
  );
```

### 3.2. Serviço Backend (`aresta-back-node/src/services/userSettings.service.ts`)
Normalização segura:
- Se `pageAnimationEnabled === false`, `pageCreaseEnabled` é automaticamente persistido como `false`.

## 4. Frontend & Componentes Visuais

### 4.1. Cálculo Matemático da Pilha de Páginas (`PageCurlCanvas.vue`)
```typescript
const MAX_STACK_PX = 14;

const pageStackDepth = computed(() => {
  if (!store.document || store.totalPages <= 1 || !pageCreaseEnabled.value || !pageAnimationEnabled.value) {
    return { leftWidth: 0, rightWidth: 0, leftLines: 0, rightLines: 0 };
  }

  const total = store.totalPages;
  const current = store.currentPage;
  
  // Fator de escala para livros muito curtos (< 20 páginas)
  const maxAllowed = Math.min(MAX_STACK_PX, Math.max(4, Math.round((total / 30) * MAX_STACK_PX)));

  const progress = Math.max(0, Math.min(1, (current - 1) / Math.max(1, total - 1)));
  const remaining = 1 - progress;

  const leftWidth = Math.round(progress * maxAllowed);
  const rightWidth = Math.round(remaining * maxAllowed);

  const leftLines = Math.min(8, Math.round(progress * 8));
  const rightLines = Math.min(8, Math.round(remaining * 8));

  return { leftWidth, rightWidth, leftLines, rightLines };
});
```

### 4.2. Estilo Visual e Camadas Escalonadas CSS
As pilhas laterais utilizam pseudo-elementos e múltiplos `box-shadows` com chanfros de papel e linhas escalonadas, adaptando-se aos temas:
- **Tema Sépia**: Fundo `#f2ebd9`, linhas em `rgba(139, 94, 60, 0.18)`, sombra `rgba(70, 45, 20, 0.15)`.
- **Tema Branco**: Fundo `#f8f8f8`, linhas em `rgba(0, 0, 0, 0.08)`, sombra `rgba(0, 0, 0, 0.12)`.
- **Tema Preto**: Fundo `#1a1a1e`, linhas em `rgba(255, 255, 255, 0.08)`, sombra `rgba(0, 0, 0, 0.6)`.

### 4.3. Interface de Configurações (`conta.vue` e `SettingsModal.vue`)
- Switch "Efeitos de Livro Físico (Vinco e Pilha de Páginas)".
- Quando `pageAnimationEnabled === false`:
  - O switch é renderizado com `disabled` e opacidade reduzida.
  - Um badge/aviso informativo: *"Requer a Virada de Página 3D ativada"*.

## 5. Tratamento de Erros & Fallbacks
- Caso o documento não possua `totalPages` mapeado ou seja de página única, as larguras das pilhas retornam 0px sem causar erros de renderização.
- Caso a API retorne 400 por incompatibilidade de payload, o composable `useSettings` reverte o estado reativo local para manter sincronismo com o servidor.

## 6. Estratégia de Testes
- **Backend**:
  - Teste de validação Zod rejeitando `pageAnimationEnabled: false` com `pageCreaseEnabled: true`.
  - Teste do service normalizando `pageCreaseEnabled = false` quando `pageAnimationEnabled = false`.
- **Frontend**:
  - Teste unitário do composable `useSettings`.
  - Teste unitário de renderização do switch dependente em `conta.vue` e `SettingsModal.vue`.
  - Teste de cálculo de profundidade e renderização em `PageCurlCanvas.vue`.
