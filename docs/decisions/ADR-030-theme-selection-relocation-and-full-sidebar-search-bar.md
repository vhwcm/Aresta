# ADR-030: Realocação da Escolha de Tema para a Conta e Barra Completa de Pesquisa na Barra Lateral

## Status
Aceito

## Contexto
Na barra lateral (`FolderTagSidebar.vue`), o cabeçalho superior continha o botão de alternância rápida de temas (Claro / Sépia / Escuro), o ícone de lupa para busca de nós do grafo, o botão de feedback, o atalho para Minha Conta e o indicador de ofensiva diária.

Essa configuração trazia dois atritos de ergonomia e design:
1. **Sobrecarga do Cabeçalho Superior**: A seleção de tema é uma preferência de sistema/aparência de baixa frequência, não devendo ocupar espaço nobre no cabeçalho operacional principal da navegação lateral.
2. **Affordance de Pesquisa Comprometida**: A pesquisa dependia de um clique prévio no ícone de lupa para exibir condicionalmente um campo suspenso, dificultando a busca rápida e a visão imediata de busca no Grafo de Conhecimento e Workspace.

## Decisão
1. **Remoção do Alternador de Tema da Barra Lateral**:
   - O botão de alternância de tema foi removido do topo da barra lateral (`FolderTagSidebar.vue`).
   - O controle de tema da aplicação foi incorporado como primeira opção na seção de **Preferências da Aplicação** na página de conta (`/conta`, em `conta.vue`), com layout segmentado de 3 estados (Claro, Sépia, Escuro), ícones representativos (`SunIcon`, `PaletteIcon`, `MoonIcon`) e sincronização reativa com o motor de leitura via `useSettings()`.

2. **Barra Completa de Pesquisa no Sidebar**:
   - O ícone de lupa foi retirado do cabeçalho superior.
   - Uma barra completa de pesquisa (`[data-testid="sidebar-search-container"]`) foi posicionada de forma persistente logo abaixo do cabeçalho superior (`h-14`) e acima do grid de navegação principal (Início/Grafo, Livros, Revisão/Flashcards e Criação (+)).
   - A barra oferece input contínuo com ícone de busca, limpeza instantânea (`✕`), atalho `ESC` e comutação automática para visualização em grafo ao digitar.

## Consequências
- **Positivas**:
  - Cabeçalho superior despoluído e focado nas ações de conta, ofensiva e feedback.
  - Maior rapidez e visibilidade na busca de nós do Grafo e itens de trabalho com a barra de pesquisa sempre acessível.
  - Preferências centralizadas de forma coerente e canônica em `/conta`.
- **Negativas/Mitigações**:
  - Alternância de tema agora requer acesso a `/conta` ou popover de leitura, mas reflete o comportamento padrão de design de aplicações modernas (e.g. Linear, Notion, Obsidian).
