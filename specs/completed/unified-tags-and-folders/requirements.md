# Requisitos: Unificação Arquitetural de Tags e Pastas de Arquivos

## 1. Objetivo Geral
Unificar conceitualmente e estruturalmente as entidades de **Pastas** e **Tags** no ecossistema Aresta. Pastas deixam de ser um atributo segregado de diretório plano e passam a ser os próprios nós de tags no Grafo de Conhecimento. Qualquer arquivo (Livro, Quadro Canvas, Nota, Desenho, Link) associado a uma ou mais tags aparecerá na árvore lateral de arquivos em cada uma dessas tags/pastas como referências dinâmicas ao mesmo nó.

---

## 2. Escopo

### Incluído
- **Entidade Unificada Tag/Pasta**: Toda pasta criada na árvore gera ou reutiliza um nó de tag/tema.
- **Múltiplas Referências de Arquivos**: Se um arquivo tiver $N$ tags associadas, ele será renderizado dentro de cada uma das $N$ pastas na árvore de arquivos lateral.
- **Hierarquia de Pastas e Subpastas**: Suporte a tags hierárquicas (ex: `#estudos/filosofia` ou relação pai/filho) refletidas como pastas e subpastas aninhadas na UI e arestas hierárquicas no grafo.
- **Sinalização Visual de Referência**: Ícone discreto de vínculo/atalho e tooltip contextual informando todas as outras pastas/tags em que o arquivo se encontra.
- **Drag-and-Drop com Menu Contextual**: Ao arrastar um arquivo para outra pasta na árvore, exibir menu rápido para o usuário escolher entre *"Mover para cá"* (substitui a tag de origem) ou *"Adicionar referência nesta pasta"* (mantém em ambas).
- **Semântica de Exclusão Refinada**: Ações explícitas no menu de contexto do arquivo: *"Remover desta pasta/tag"* (desassocia a tag específica) e *"Excluir arquivo definitivamente"* (apaga o arquivo do sistema e de todas as pastas/tags).
- **Adequação da Barra Lateral (`FolderTagSidebar.vue`)**:
  - Remoção da seção segregada de "Filtro por Tags" (a árvore de arquivos assume diretamente essa função).
  - Remoção de títulos redundantes acima da árvore de arquivos.
  - Preservação da estética visual refinada atual (contadores, chevrons, ícones de arquivo e badges de tipo).
- **Migração Transparente de Dados Legados**: Itens que possuíam o campo `folder` preenchido terão seus valores incorporados automaticamente ao array `tags`, preservando o histórico sem perda de dados.

### Não Incluído
- Alteração no leitor 3D de livros ou no motor de virada de página.
- Criação de links simbólicos a nível de sistema operacional (SO local); a referência é gerida na camada de metadados e no grafo da aplicação.

---

## 3. Requisitos Funcionais

### R1. Unificação da Identidade de Tag e Pasta
- **Descrição**: No modelo de domínio, a pasta é a representação em diretório de uma Tag. Ao criar uma pasta "Filosofia", cria-se/associa-se a tag "Filosofia". Não existem duas entidades divergentes.
- **Atores**: Usuário Autenticado, Sistema.
- **Regra de Validação**: Nomes de tags/pastas devem ser sanitizados contra caracteres especiais inválidos (`\`, `*`, `?`, etc.) e normalizados em formato legível.

### R2. Suporte a Hierarquia e Subpastas (`#pai/filho`)
- **Descrição**: O usuário pode criar subpastas dentro de pastas (ou declarar tags com `/`, ex: `Tecnologia/Frontend`). A árvore renderiza a subpasta aninhada, e o grafo representa essa relação hierárquica.
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: Uma tag filha não pode ser pai de si mesma (ciclos hierárquicos são proibidos).

### R3. Projeção de Múltiplas Referências na Árvore de Arquivos
- **Descrição**: Um arquivo (ex: Nota `Resumo Platão` com as tags `["Filosofia", "História"]`) deve aparecer tanto dentro da pasta `Filosofia` quanto dentro da pasta `História`.
- **Atores**: Sistema.
- **Regra de Validação**: Ambas as instâncias apontam para o mesmíssimo `id` e conteúdo. Qualquer alteração no arquivo (título, conteúdo, etc.) reflete imediatamente em todas as suas instâncias na árvore.

### R4. Indicador Visual de Referência Múltipla
- **Descrição**: Quando um arquivo estiver presente em mais de uma pasta/tag, sua linha na árvore exibe um ícone discreto de link/atalho ou badge sutil.
- **Atores**: Sistema, Usuário Autenticado.
- **Regra de Validação**: Ao passar o mouse sobre o indicador, um tooltip deve listar todas as tags/pastas onde aquele arquivo está catalogado.

### R5. Drag-and-Drop Inteligente com Menu de Decisão
- **Descrição**: Ao arrastar um arquivo de uma pasta $A$ para uma pasta $B$, um menu popover/dropdown imediato oferece:
  1. **Mover para esta pasta**: Remove a tag $A$ e adiciona a tag $B$.
  2. **Adicionar referência nesta pasta**: Mantém a tag $A$ e adiciona a tag $B$ (compartilhando o nó).
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: Se o arquivo já possui a tag $B$, a ação é bloqueada com notificação explicativa.

### R6. Semântica de Exclusão Clara
- **Descrição**: No menu de opções de cada arquivo na árvore:
  - Botão/Ação **"Remover desta pasta (#tag)"**: Remove apenas a tag correspondente daquele arquivo. Se o arquivo ainda possuir outras tags, ele continuará existindo nas outras pastas. Se não possuir mais nenhuma tag, passa a ficar na seção "Sem pasta" (não categorizado).
  - Botão/Ação **"Excluir arquivo definitivamente"**: Remove permanentemente o arquivo do repositório/banco, excluindo-o de todas as tags e do grafo.
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: Exclusão definitiva exige confirmação do usuário (modal de confirmação).

### R7. Simplificação da Barra Lateral (`FolderTagSidebar.vue`)
- **Descrição**: 
  - A árvore de arquivos não deve ter título fixo ("PASTAS" ou "ARQUIVOS").
  - A seção separada de "Filtro por Tags" é removida.
  - A árvore mantém seu layout atual (ícones, chevron de expansão, badges e contadores).
  - Itens sem nenhuma tag continuam agrupados em uma seção neutra "Sem pasta".
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: Responsividade preservada no desktop e no mobile.

### R8. Migração Automática e Transparente de Dados
- **Descrição**: Ao carregar a aplicação pela primeira vez com o novo sistema, qualquer entidade (Canvas, Nota, Desenho, Link, Livro) que tenha um valor não vazio em `folder` terá esse valor adicionado ao seu array `tags` (caso já não esteja presente).
- **Atores**: Sistema.
- **Regra de Validação**: Idempotente; executar múltiplas vezes não duplica tags nem corrompe dados existentes.

---

## 4. Requisitos Não Funcionais
- **Performance**: A construção do grafo e da árvore unificada deve ser executada com complexidade $O(N \cdot T)$, onde $N$ é o número de itens e $T$ a média de tags por item, respondendo em menos de 50ms para até 5.000 itens.
- **Local-First & Offline**: A árvore unificada e as referências funcionam 100% offline via IndexedDB/SQLite local.
- **Integridade Referencial**: Ao renomear uma tag/pasta, todos os arquivos que a possuem são atualizados de forma atômica no repositório local.

---

## 5. Critérios de Aceite
- [ ] Um arquivo associado a 2 tags (`#alpha` e `#beta`) é visível dentro de ambas as pastas na árvore de arquivos.
- [ ] Alterar o título de uma nota reflete simultaneamente em suas referências em todas as pastas.
- [ ] O ícone de referência/link é exibido apenas em arquivos associados a mais de 1 tag.
- [ ] Ao arrastar um arquivo para outra pasta, o menu exibe "Mover para esta pasta" e "Adicionar referência nesta pasta".
- [ ] Ao escolher "Remover desta pasta", apenas a tag da pasta atual é removida do arquivo.
- [ ] Ao escolher "Excluir definitivamente", o arquivo é apagado por completo de todas as pastas.
- [ ] A barra lateral não exibe título sobre a árvore e não exibe a antiga seção segregada de filtro de tags.
- [ ] Subpastas hierárquicas (ex: `A/B`) abrem e fecham corretamente com chevrons aninhados.
- [ ] Migração mescla automaticamente campos legados `folder` em `tags` sem duplicações.
