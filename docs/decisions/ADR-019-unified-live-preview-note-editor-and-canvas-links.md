# ADR-019: Unificação do Editor de Notas em Modo Único Live Preview, Links Amigáveis de Quadros e Vínculo no Grafo

## Status
Aceito e Implementado

## Data
2026-09-18

## Contexto
Anteriormente, o editor de anotações (`NoteEditorPane.vue`) possuía 3 modos de visualização alternáveis ("Editor", "Dividido" e "Preview") e tentava renderizar quadros inteiros (`CanvasEmbedPreview.vue`) como mini-aplicações interativas completas embutidas diretamente no corpo da nota quando o usuário utilizava a sintaxe `![[canvas:<id>]]`.

Essa abordagem causava diversos problemas:
1. **Sobrecarga de Interface e Desperdício de Área Útil**: O modo dividido forçava painéis duplicados lado a lado (editor à esquerda e renderizador à direita), quebrando o foco da escrita.
2. **Degradação de Performance**: Carregar múltiplos boards de canvas interativos com nós, arestas e listeners dentro de uma nota causava latência de renderização e risco de estouro de memória.
3. **Falta de Clareza na Edição**: O usuário precisava alternar entre abas para ver o resultado, contradizendo a filosofia de escrita fluida e Live Preview contínuo.
4. **Isolamento de Conexões**: Não havia criação direta de novos quadros a partir do editor nem conexão bidirecional clara das notas com quadros no Grafo de Conhecimento local.

## Decisão

1. **Modo Único Live Preview Unificado**:
   - Remoção completa dos botões de alternância de modo ("Editor", "Dividido", "Preview") e do split-pane.
   - O editor opera exclusivamente em tela cheia com `MilkdownEditor`, renderizando a formatação Markdown em tempo real no mesmo espaço onde o usuário escreve, preservando a sintaxe para edição instantânea.

2. **Substituição de Embed por Links de Quadros Clicáveis**:
   - Quadros não são mais embutidos como painéis interativos pesados no meio do texto.
   - A vinculação passa a inserir links amigáveis estilizados no padrão Markdown: `[🎨 Nome do Quadro](canvas:<uuid>)` ou `[[canvas:<uuid>]]`.
   - Links de quadros são renderizados com estilos dedicados de badge/pill (ícone, cor de destaque, borda sutil e efeito hover).
   - **Navegação**: Clique direto no link abre imediatamente o quadro correspondente (`/canvas/:id`). Ao segurar `Ctrl` ou `Cmd`, o cursor entra no texto para permitir a edição do link sem disparar a navegação.

3. **Modal de Vinculação e Criação Instantânea**:
   - O botão na barra de ferramentas foi renomeado para "Vincular Quadro" e abre um modal com duas abas:
     - **Quadro Existente**: Campo de busca em tempo real com lista de quadros cadastrados e botão de vínculo imediato.
     - **Criar Novo Quadro**: Campo de texto para título; cria o quadro instantaneamente no banco de dados local (`CanvasRepository`) e insere o link formatado diretamente na posição do cursor da nota.

4. **Vínculo Automático no Grafo de Conhecimento**:
   - O construtor do grafo local (`buildLocalGraph.ts`) e o composable `useNotes.ts` passam a analisar o conteúdo Markdown em busca de referências a quadros (`canvas:<id>`).
   - Arestas do tipo `note-canvas` são geradas conectando `note-<id>` diretamente a `canvas-<id>`, tornando a relação visível, explorável e navegável no Grafo de Conhecimento global.

## Consequências

### Positivas
- Interface de escrita limpa, rápida e imersiva, sem divisões artificiais de tela.
- Redução drástica do consumo de memória e tempo de renderização de notas.
- Criação e conexão de mapas visuais de forma integrada e contextual à escrita.
- Exploração relacional no Grafo de Conhecimento com arestas reais entre notas e quadros.

### Custos e Riscos
- Usuários que desejarem visualizar o quadro completo devem navegar até a tela do canvas (`/canvas/:id`) através de um simples clique no link da nota, em vez de visualizá-lo embutido na mesma tela.
