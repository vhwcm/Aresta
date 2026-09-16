# Requisitos: Livros & Livretos Didáticos com IA (Didactic Explainer Booklets)

## 1. Objetivo Geral
Implementar no ecossistema Aresta uma engine de IA especializada em tutoria e ensino didático profundo ("Didactic AI Tutor"), capaz de sintetizar e explicar conceitos complexos a partir de flashcards, anotações de leitura ou temas autônomos. A IA produz artigos e mini-livretos paginados em **Formato Próprio (Markdown Estendido com Mermaid.js, Callouts pedagógicos coloridos e Ícones Lucide)**.

Os livretos são renderizados utilizando o **Padrão Strategy de Leitura de Livros (`IBookDocument`)** através do novo **`DidacticDocumentAdapter`**, oferecendo a mesma experiência de folhear (virada 2D/3D, vinco, gestos de swipe) e o **mesmo sistema completo de anotações e grifos** existente em livros tradicionais. Adicionalmente, estabelece-se a regra de negócio de que **livretos didáticos podem ser anexados/concatenados exclusivamente em outros livretos didáticos**, permitindo a criação de compêndios e cadernos de estudo contínuos com alta cobertura de testes.

---

## 2. Escopo

- **Incluído**:
  - Engenharia de prompt pedagógica estruturada (analogias intuitivas, princípios primeiros, passos lógicos, autoavaliações rápidas e diagramas Mermaid).
  - Formato próprio de documento didático (`.ardoc` / JSON com capítulos de Markdown estendido + Mermaid + Callouts).
  - Implementação do `DidacticDocumentAdapter` integrando a interface `IBookDocument` (Strategy Pattern) no leitor do Aresta.
  - **Suporte integral a anotações e grifos no formato próprio**: seleção de texto, highlights coloridos, criação de notas e extração de flashcards compatíveis com a entidade `Annotation`.
  - **Sistema de Composição e Append Restrito**:
    - Criação de livreto independente (*Standalone Booklet*).
    - Anexação de um livreto em outro livreto existente (*Append to Booklet*), gerando um novo capítulo sequencial na obra.
    - **Regra de Validação Inegociável**: É estritamente proibido anexar um livreto em livros tradicionais externos (EPUBs/PDFs). Só é permitido appendar livreto em livreto.
  - Paginação mobile-first adaptada às dimensões do dispositivo, quebrando blocos de forma inteligente para não cortar diagramas Mermaid.
  - Pontos de entrada: Botão **"Explicar a Fundo com IA"** nos Flashcards (`/revisao`), **"Novo Livreto / Anexar a Caderno"** na Biblioteca (`/library`) e no Grafo (`NodeDrawer`).
  - **Ampla Cobertura de Testes Automatizados**: testes unitários de backend, testes de regras de validação de append, testes de adapter frontend e testes de anotações.

- **Não Incluído**:
  - Injeção de apêndices dentro de binários de livros externos (EPUB/PDF), preservando integridade de arquivos e hashes.
  - Geração de áudio/voz sintetizada (TTS) dos artigos (escopo futuro).

---

## 3. Requisitos Funcionais

### R1. Engine de Prompt Pedagógico Didático
- **Descrição**: O sistema utiliza o Gemini AI com pré-prompt especializado para gerar explicações estruturadas e intuitivas.
- **Atores**: Sistema / Provedor de IA (Gemini).
- **Regras de Negócio**:
  - Estrutura obrigatória:
    1. Analogia intuitiva do cotidiano (`> [!ANALOGY]`).
    2. Mecanismo em princípios primeiros (`> [!KEY_CONCEPT]`).
    3. Diagrama visual Mermaid válido (`flowchart`, `mindmap` ou `sequenceDiagram`).
    4. Aplicação prática e cuidados/armadilhas (`> [!WARNING]`).
    5. Síntese e autoavaliação com perguntas reflexivas.

### R2. Leitor de Formato Próprio via Strategy (`DidacticDocumentAdapter`)
- **Descrição**: O documento didático é consumido pelo leitor através do padrão Strategy `IBookDocument`.
- **Atores**: Leitor Frontend (`ReaderShell.vue` / `BookDocumentFactory.ts`).
- **Regras de Negócio**:
  - `BookDocumentFactory` instancia `DidacticDocumentAdapter` quando o tipo da obra for `didactic` (ou `is_ai_generated: true`).
  - O adapter calcula a paginação virtual das seções de Markdown, preservando a proporcionalidade de tela em smartphones e desktops.
  - Reutiliza a virada de página (2D CSS Translate e 3D Three.js Page Curl), o vinco central e as pilhas laterais de folhas.
  - Executa a renderização reativa de blocos Mermaid adaptados aos temas (Escuro, Claro, Sépia) e callouts didáticos.

### R3. Anotações & Destaques de Texto em Livretos Didáticos
- **Descrição**: O usuário pode selecionar qualquer trecho de texto no livreto didático, destacar com cor e criar anotações vinculadas.
- **Atores**: Usuário Autenticado / Leitor.
- **Regras de Negócio**:
  - O `DidacticDocumentAdapter` disponibiliza a camada de texto (`renderTextLayer`) idêntica aos adapters de PDF/EPUB.
  - O seletor gera um identificador de âncora canônica (`cfi: "didactic://chapter-X#node-Y:offsetStart-offsetEnd"`).
  - As anotações são salvas na tabela `Annotation`, sincronizadas e podem gerar novos flashcards normalmente.

### R4. Regra de Composição: Append Exclusivo "Livreto em Livreto"
- **Descrição**: O usuário pode anexar um novo capítulo/artigo explicativo ao final de um livreto didático existente para criar compêndios e cadernos de estudo.
- **Atores**: Usuário Autenticado / Backend.
- **Regras de Negócio**:
  - **Condição Válida**: Anexar explicação `E2` ao livreto `B1`, desde que `B1.is_ai_generated === true` e seu tipo seja `didactic`.
  - **Condição Inválida (Rejeição)**: Tentativa de anexar em livro com `is_ai_generated === false` (EPUB/PDF) retorna erro HTTP 422 com código `CANNOT_APPEND_TO_NON_BOOKLET`.
  - Ao anexar, o livreto pai ganha um novo capítulo no sumário (Table of Contents), a contagem total de páginas é atualizada e o `order_index` é incrementado.

### R5. Pontos de Entrada no Sistema
- **Descrição**: O usuário pode acionar a criação ou anexação de livretos a partir de múltiplos fluxos.
- **Atores**: Usuário Autenticado.
- **Regras de Negócio**:
  - **Flashcards (`/revisao`)**: Botão "Explicar com IA" permite criar como "Novo Livreto Didático" ou "Anexar a um Livreto Existente" (selecionando em um dropdown de livretos do usuário).
  - **Biblioteca (`/library`)**: Ação "Novo Caderno Didático" ou "Adicionar Capítulo com IA".
  - **Grafo (`/graph`)**: Ação de geração a partir do nó do tema selecionado.

---

## 4. Requisitos Não Funcionais & Qualidade

- **Cobertura de Testes**:
  - Mínimo de 90% de cobertura nos serviços de composição de livretos e restrições de append.
  - Testes unitários do `DidacticDocumentAdapter` para paginação, renderização e cálculo de text layers.
  - Testes de integração para as rotas `/api/v1/didactic/booklets` e `/api/v1/didactic/booklets/:id/append`.
- **Performance**: Paginação do Markdown no frontend em menos de 150ms no carregamento inicial do leitor.
- **Responsividade**: Adaptação perfeita de diagramas Mermaid em telas pequenas (zoom suave e pan com gestos de toque).

---

## 5. Critérios de Aceite

- [ ] `DidacticDocumentAdapter` implementando a interface `IBookDocument` com suporte a paginação, temas, virada 2D/3D e `renderTextLayer`.
- [ ] Sistema de anotações funcionando no livreto didático (seleção, grifo, nota e persistência na tabela `annotations`).
- [ ] Endpoint de criação de livreto avulso (`POST /api/v1/didactic/booklets`).
- [ ] Endpoint de anexação de capítulo em livreto (`POST /api/v1/didactic/booklets/:id/append`).
- [ ] Validação estrita rejeitando anexação em livros convencionais (`CANNOT_APPEND_TO_NON_BOOKLET`).
- [ ] Suíte de testes unitários e de integração validando o ciclo de vida, as anotações e a restrição de append com 100% de aprovação.
- [ ] Botão de "Explicar com IA" na tela `/revisao` permitindo abrir livreto ou anexar a um existente.
