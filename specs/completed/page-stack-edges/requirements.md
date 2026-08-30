# Requisitos: Pilha de Páginas Laterais & Efeitos de Livro Físico (Page Stack Edges)

## 1. Objetivo Geral
Proporcionar uma experiência de leitura imersiva e realista no leitor de livros do Aresta, renderizando camadas visuais laterais que representam a espessura e a quantidade de páginas do livro:
- À esquerda da página aberta: o volume de páginas já lidas (proporcional ao progresso da leitura).
- À direita da página aberta: o volume de páginas restantes (proporcional ao que falta ler).
- As bordas são interativas, permitindo clicar/tocar para avançar ou retroceder páginas.
- Esta funcionalidade é integrada à configuração de efeitos de livro físico (vinco/viga central) e possui dependência estrita da animação 3D de virada de página (só pode ser ativada se a viragem 3D estiver habilitada, com validação garantida tanto no frontend quanto no backend).

## 2. Escopo
- **Incluído**:
  - Renderização dinâmica de camadas/linhas escalonadas nas bordas externas das páginas em repouso no `PageCurlCanvas.vue`.
  - Cálculo adaptativo de espessura (0px a 14px) baseado na porcentagem lida vs. restante com teto adaptativo ao total de páginas.
  - Suporte completo a temas visuais do leitor (`sepia`, `white`, `black`).
  - Responsividade: exibição em telas >= 768px (modo 2 páginas e modo 1 página), com ocultação limpa em telas móveis pequenas (< 768px) para priorizar a área útil de leitura.
  - Interatividade: clique/toque na pilha esquerda volta página e na pilha direita avança página.
  - Validação cruzada Frontend e Backend: o efeito de livro/vinco/pilha só pode estar ativo quando `pageAnimationEnabled === true`. Se a animação 3D for desativada, os efeitos de livro são desativados automaticamente e o backend rejeita com 400 payloads explicitamente conflitantes ou normaliza quando aplicável.
  - Atualização dos modais e páginas de configuração (`conta.vue`, `SettingsModal.vue`, `useSettings.ts`).
- **Não Incluído**:
  - Renderização de texto nas bordas em corte lateral do livro (apenas camadas de papel/linhas estilizadas).
  - Alteração de layout no modo contínuo de scroll vertical se houver (o efeito é exclusivo do leitor paginado).

## 3. Requisitos Funcionais

### R1. Renderização das Pilhas Laterais de Páginas
- **Descrição**: No leitor de livros, renderizar bordas laterais escalonadas com linhas sutis que simulam as folhas empilhadas do livro aberto.
  - Borda esquerda: espessura proporcional a `currentPage / totalPages`.
  - Borda direita: espessura proporcional a `(totalPages - currentPage) / totalPages`.
- **Atores**: Usuário Leitor.
- **Regra de Validação**: A espessura máxima é de 14px em livros longos, com teto adaptativo reduzido para documentos com poucas páginas (< 20 páginas), evitando distorções visuais.

### R2. Suporte a Temas de Cor
- **Descrição**: O visual das camadas deve se adaptar harmoniosamente ao tema ativo do leitor:
  - *Sépia*: tons amarelados/pergaminho com linhas finas e sombra dourada/marrom.
  - *Branco/Claro*: tons off-white e cinza sutil com sombras limpas.
  - *Preto/Escuro*: tons grafite escuro com linhas cinza-escuro e realces sutis.
- **Atores**: Usuário Leitor.

### R3. Interatividade de Navegação
- **Descrição**: Clicar ou tocar na área da pilha de páginas da esquerda executa o comando de página anterior (`previous()`), e na pilha da direita executa próxima página (`next()`).
- **Atores**: Usuário Leitor.

### R4. Responsividade e Modo de Leitura
- **Descrição**: O efeito de pilha lateral é renderizado em visualizações desktop e tablet (largura >= 768px). Em telas pequenas móveis (< 768px), o efeito é ocultado para maximizar a área de leitura e evitar cortes horizontais.
- **Atores**: Usuário Leitor Mobile/Desktop.

### R5. Dependência Estrita de Configuração (Frontend)
- **Descrição**: A opção de efeitos de livro físico (`pageCreaseEnabled`) só pode ser ativada na UI se `pageAnimationEnabled` (viragem 3D) estiver ativada.
  - Se `pageAnimationEnabled` for desmarcado pelo usuário, `pageCreaseEnabled` deve ser desligado automaticamente e desabilitado na interface com mensagem informativa indicando a dependência.
- **Atores**: Usuário em Configurações (`conta.vue`, `SettingsModal.vue`).

### R6. Validação e Normalização de Configurações (Backend)
- **Descrição**: O endpoint de atualização de configurações (`PUT /api/user/settings`):
  - Normaliza automaticamente: se `pageAnimationEnabled === false`, persiste `page_crease_enabled = false`.
  - Valida e rejeita com código HTTP 400 Bad Request se o payload explicitar `pageAnimationEnabled: false` e `pageCreaseEnabled: true`.
- **Atores**: API REST, Usuário Autenticado.

## 4. Requisitos Não Funcionais
- **Performance**: As pilhas devem ser calculadas via propriedades computadas leves e renderizadas em CSS puro (box-shadows/pseudo-elementos/divs leves), sem gerar repaints excessivos durante o arraste 3D das páginas.
- **Acessibilidade**: Elementos decorativos possuem `aria-hidden="true"` ou roles adequadas para navegação auxiliar sem poluir leitores de tela.
- **Compatibilidade**: Suporte em todos os navegadores modernos (Chrome, Firefox, Safari, Edge).

## 5. Critérios de Aceite
- [ ] No início do livro (página 1), a pilha esquerda tem espessura mínima (0px) e a pilha direita tem espessura máxima (~14px).
- [ ] No final do livro, a pilha esquerda tem espessura máxima (~14px) e a pilha direita tem espessura mínima (0px).
- [ ] Clicar na pilha esquerda volta a página; clicar na pilha direita avança a página.
- [ ] As linhas e cores mudam corretamente ao alternar entre os temas Sépia, Branco e Preto.
- [ ] Desativar a animação 3D na tela de configurações desabilita e desliga automaticamente os efeitos de livro/pilha de páginas.
- [ ] Enviar `{ pageAnimationEnabled: false, pageCreaseEnabled: true }` para a API do backend retorna erro 400 com mensagem clara de validação.
- [ ] Todos os testes automatizados do frontend e backend passam com 100% de sucesso nos quality gates.
