# Requisitos: Anotações em Livros e Trechos de Notas com Flashcards via IA e Rastreamento de Fonte

## 1. Objetivo Geral
Permitir a criação de anotações e flashcards via IA a partir de **trechos selecionados de texto** tanto em livros (no Leitor) quanto em notas (no bloco do Canvas e no Editor de Notas), com rastreamento explícito da fonte ("Ver Fonte ↗") e exclusão em cascata quando a nota ou livro de origem for excluído.

## 2. Requisitos Funcionais

- **R1: Seleção de Trecho em Livros e em Notas do Canvas**
  - O usuário seleciona um **trecho específico de texto** (snippet) dentro de um livro ou dentro de uma nota no Canvas.
  - Ao selecionar, surge a opção para anotar e transformar aquele trecho em Flashcard com IA.

- **R2: Opção "Transformar em Flashcard com IA" no Modal de Anotação**
  - O modal contém o trecho selecionado, campo para comentário/reflexão, seleção de temas e o toggle "Transformar em Flashcard com IA".
  - Ao salvar, a janela fecha de imediato e a IA gera a pergunta e resposta em segundo plano.

- **R3: Rastreabilidade com Link para a Fonte no Flashcard**
  - Durante o estudo do Flashcard, um botão "Ver Fonte ↗" direciona:
    - Para o Leitor de livros se originado de um livro (`/reader?bookId=...`).
    - Para o Canvas se originado de uma nota (`/canvas?tab=notes&noteId=...`).

- **R4: Exclusão em Cascata da Fonte**
  - Ao deletar uma anotação de livro, seu flashcard é removido.
  - Ao deletar uma nota do Canvas, todos os flashcards originados de trechos dessa nota são removidos.

- **R5: Central de Revisão por Temas**
  - Anotações agrupadas visualmente por temas com contadores e filtros rápidos no topo.
  - Alternância de status de flashcard (Criar com IA / Desvincular) diretamente em cada anotação.

- **R6: Testes Automatizados**
  - Testes cobrindo criação por trecho em nota, navegação à fonte, alternância e cascata de exclusão.
