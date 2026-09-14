# ADR-013: Notas de Desenho Paginadas com Rejeição de Palma e Síntese em HTML Semântico via IA

## Status
Aceito (Accepted)

## Data
2026-09-13

## Contexto
O ecossistema Aresta contemplava anotações conceituais em texto Markdown (`Note`) e lousa conceitual infinita (`Canvas`). No entanto, fluxos intensivos de estudo e síntese cognitiva frequentemente exigem o ato de desenhar e rabiscar livremente em cadernos paginados digitais (similar ao Samsung Notes), com canetas digitais (S-Pen, Apple Pencil, stylus Wacom).
Além da experiência de inking fluido e rejeição de contato acidental da palma da mão, existia a necessidade de converter anotações manuais, diagramas e tabelas em documentos estruturados de primeira classe em HTML semântico com CSS moderno via IA multimodal (Gemini Vision), com split view para conferência e opção de conversão em Nota tradicional do sistema com descarte do rascunho original.

## Decisão
1. **Modelo de Dados Dedicado no Prisma (`DrawingNote`)**:
   - Criação da tabela de 1ª classe `drawing_notes` no PostgreSQL com campos `id` (UUID), `user_id`, `title`, `folder`, `tags`, `pages_data` (Text JSON) e `preview_url`.
   - Geração e versionamento da migration SQL `20260913220000_add_drawing_notes_table/migration.sql` conforme a Regra Inegociável 3.2 do monólito.
   - Relacionamento em cascata com o modelo `User`.

2. **Engine de Desenho Paginada no Frontend (`perfect-freehand` + Pointer Events API)**:
   - Caderno vertical contínuo com páginas A4 (794 x 1123), proporção física real, numeração automática e fundos intercambiáveis (pautada, quadriculada, pontilhada, em branco).
   - Suporte a múltiplos tipos de caneta: Esferográfica (`pen`), Tinteiro/Caligrafia (`fountain`), Lápis (`pencil`), Marca-texto translúcido (`highlighter`) com blend mode `multiply` e Borracha (`eraser`).
   - Traços perfeitamente uniformes e limpos, sem sensibilidade indesejada de pressão manual.
   - **Rejeição de Palma Inteligente (Palm Rejection)**: Detecção de `pointerType === 'pen'`, suprimindo eventos de toque acidental ou contato de palma larga (`e.width > 25`).
   - **Suporte ao Botão da S-Pen / Stylus**: Detecção do botão lateral pressionado (`e.buttons & 2` ou `e.buttons & 32`), ativando a borracha instantaneamente enquanto o usuário mantém o botão pressionado.

3. **Autosave Contínuo com Debounce e Backup Local**:
   - Composable `useDrawing.ts` com debounce de 1.5s sincronizando com `PUT /api/drawings/:id` e salvamento imediato em `localStorage` para resiliência a falhas de rede.
   - Histórico ilimitado de desfazer/refazer por estado de páginas.

4. **Síntese Semântica Multimodal com Gemini Vision**:
   - Renderização das páginas do Canvas em imagens de alta definição PNG.
   - Endpoint `/api/drawings/:id/synthesize` alimentando o modelo multimodal do Gemini com prompt rigoroso para gerar exclusivamente HTML semântico puro com CSS moderno autocontido (cards com flex/grid para diagramas, tabelas com `<thead>`/`<tbody>`, cabeçalhos, badges e callouts).
   - Modal split view interativo (`DrawingAiSynthesisModal.vue`) exibindo o desenho de origem e o HTML renderizado.
   - Ação "Salvar como Nota" (`/api/drawings/:id/convert-to-note`), criando uma `Note` tradicional e opcionalmente excluindo o desenho de origem (`deleteOriginal`).

5. **Hub Unificado no `/canvas`**:
   - Atualização das abas de visualização para **Todos**, **Quadros**, **Notas** e **Desenhos**.
   - Cards dedicados com preview visual, contagem de páginas e ações de abertura e exclusão.
   - Botão rápido "+ Novo Desenho" no cabeçalho desktop e mobile.

## Consequências
- **Positivas**:
  - Experiência completa de caderno digital estilo Samsung Notes dentro do ecossistema Aresta.
  - Ponte direta entre anotação manual analógica e síntese digital semântica estruturada via inteligência artificial.
  - Total resiliência com autosave contínuo e histórico.
  - Quality Gates verdes com cobertura de testes unitários no backend e frontend.
