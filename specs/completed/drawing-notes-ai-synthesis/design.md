# Design Técnico: Notas de Desenho Paginadas com Rejeição de Palma e Síntese em HTML Semântico via IA

## 1. Visão Geral da Arquitetura

O sistema adiciona um terceiro pilar de captura visual ao Aresta Monolith:
1. **Quadros (`Canvas`)**: Lousa infinita com nós, formas, texto e conexões conceituais.
2. **Notas (`Note`)**: Documentos estruturados em Markdown/Live-Preview.
3. **Desenhos (`DrawingNote`)**: Caderno paginado digital vertical estilo Samsung Notes, otimizado para canetas/stylus com detecção de pressão, rejeição de palma e síntese semântica por visão computacional (Gemini Vision) em HTML puro estilizado.

## 2. Modelagem de Banco de Dados (Prisma)

### Tabela `drawing_notes`
```prisma
model DrawingNote {
  id          String   @id @default(uuid())
  user_id     Int
  title       String   @default("Desenho sem título")
  folder      String?
  tags        String   @default("[]")
  pages_data  String   @db.Text // JSON: array de DrawingPage
  preview_url String?  @db.Text // Thumbnail base64 ou URL de preview
  created_at  DateTime @default(now())
  updated_at  DateTime @default(now()) @updatedAt
  user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, updated_at])
  @@index([user_id, folder])
  @@map("drawing_notes")
}
```

### Tipagem das Páginas e Traços (JSON `pages_data`)
```typescript
export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number;
}

export type PenToolType = 'pen' | 'fountain' | 'pencil' | 'highlighter' | 'eraser';

export interface DrawingStroke {
  id: string;
  tool: PenToolType;
  color: string;
  size: number;
  opacity: number;
  points: DrawingPoint[];
}

export type PageBackgroundType = 'blank' | 'ruled' | 'grid' | 'dots';

export interface DrawingPage {
  id: string;
  pageNumber: number;
  width: number;
  height: number;
  backgroundType: PageBackgroundType;
  strokes: DrawingStroke[];
}
```

## 3. Contratos de API (Backend - `apps/api`)

### Rotas do Módulo `drawings`:
- `GET /api/drawings`: Retorna lista resumida dos desenhos do usuário autenticado (id, title, folder, tags, pagesCount, preview_url, updated_at).
- `POST /api/drawings`: Cria um novo desenho com 1 página padrão.
- `GET /api/drawings/:id`: Retorna o desenho completo incluindo `pages_data`.
- `PUT /api/drawings/:id`: Atualização com debounce contínuo (título, pasta, tags, `pages_data`, `preview_url`).
- `DELETE /api/drawings/:id`: Remove o desenho (com validação estrita de `user_id`).
- `POST /api/drawings/:id/synthesize`: Recebe payload com `{ images: string[] }` (data URLs das páginas em PNG) ou gera no backend a partir de `pages_data`, envia para Gemini Vision e retorna `{ html: string, titleSuggested: string, summary: string }`.

## 4. Arquitetura da Engine de Desenho e Rejeição de Palma (Frontend)

### Rejeição de Palma (Palm Rejection)
1. **Detecção de Tipo de Ponteiro (`PointerEvent.pointerType`)**:
   - Quando um evento `pointerdown` ocorre com `pointerType === 'pen'`, o estado `isPenActive = true` é acionado.
   - Qualquer evento simultâneo ou subsequente com `pointerType === 'touch'` tem `event.preventDefault()` e `event.stopPropagation()` acionados e não gera traços.
   - Detecção de contato de palma acidental: se `event.width > 30` ou `event.height > 30` (área de contato da mão descansando na tela), o evento é descartado.
   - Botão de alternância na barra: "Rejeição de Palma: Ativada / Modo Caneta Estrita".
2. **Geração de Traços Suaves (`perfect-freehand`)**:
   - `getStroke(points, options)` calcula o polígono contornado com variação orgânica por pressão e velocidade.
   - Caneta: variação sutil, ponta arredondada.
   - Caneta Tinteiro / Caligrafia: alta resposta à pressão.
   - Lápis: traço com textura suave e opacidade 0.6.
   - Marca-texto: `globalCompositeOperation = 'multiply'` com opacidade 0.35 e espessura larga.
   - Borracha: remove traços interceptados ou apaga via corte no Canvas.

## 5. Pipeline de IA Multimodal (Gemini Vision)

### Prompt de Engenharia para Síntese Semântica
O prompt instrui o modelo a agir como um compilador e designer de conteúdo visual de alta precisão:
- Analisar rigorosamente o manuscrito, títulos sublinhados, caixas, setas, listas, diagramas e tabelas.
- Saída estrita em **HTML semântico puro e CSS moderno autocontido** (sem tags Markdown, sem blocos quebrando).
- Diagramas e fluxogramas são transpostos para **cards visuais interligados com flexbox/grid**, badges e conexões limpas em CSS.
- Tabelas desenhadas viram `<table>` com bordas suaves, alinhamento correto e contraste perfeito.
- Estilo compatível com o design system do Aresta (modo escuro / claro amigável).

## 6. Fluxo de Visualização e Conversão
```
[ Desenho em Páginas ] 
       │
       ▼ (clica "Transformar com IA")
[ Renderização Canvas em PNGs de alta resolução ]
       │
       ▼
[ POST /api/drawings/:id/synthesize ]
       │
       ▼
[ Modal Split View: Desenho Original (Esq) vs HTML Gerado (Dir) ]
       │
       ├─ [ Descartar ] ──> Fecha sem alterações
       │
       └─ [ Salvar como Nota ] 
             │
             ├── POST /api/notes (com HTML formatado)
             └── Se [x] Excluir desenho original ──> DELETE /api/drawings/:id
```
