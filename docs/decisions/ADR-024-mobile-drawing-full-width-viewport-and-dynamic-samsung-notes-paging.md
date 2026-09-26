# ADR-024: Enquadramento Total de Folha Mobile e Criação Automática de Páginas (Samsung Notes One UI)

## Status
Aceito (Accepted)

## Data
2026-09-26

## Contexto
No módulo de notas de desenho paginadas (`/canvas/drawing/:id`), a experiência de uso em dispositivos móveis (telas `< 768px`) apresentava atritos visuais e ergonômicos significativos:
1. **Redução Excessiva de Escala**: O cálculo de adaptação (`calculateFitScale`) tentava encaixar tanto a largura quanto a altura no viewport restrito de smartphones, reduzindo a folha para ~44% do tamanho original e gerando grandes espaços pretos vazios nas laterais.
2. **Descentralização por Botão Invasivo**: O botão flutuante circular de adicionar página ficava dentro do trilho flex ao lado da folha, empurrando a Página 1 para o canto esquerdo da tela.
3. **Criação de Páginas**: Em cadernos digitais modernos para smartphone (como o Samsung Notes no ecossistema One UI), o usuário não depende de clicar em botões para adicionar folhas; basta deslizar para o lado onde não há página para que uma nova seja criada instantaneamente.

## Decisão
1. **Enquadramento Adaptativo Total (Edge-to-Edge) no Mobile**:
   - Para telas mobile (`window.innerWidth < 768px`), o cálculo da escala da folha (`calculateFitScale`) é definido pela largura total da tela: `scaleW = window.innerWidth / 794`.
   - A folha passa a ocupar 100% da largura horizontal da tela, eliminando bordas vazias e garantindo o máximo de área útil de escrita para stylus e dedos.
   - Respiro vertical superior (`pt-20 md:py-8`) e inferior (`pb-16 md:py-8`) para isolar completamente a folha da barra de ferramentas fixa no topo (`top-16`) e da pílula de zoom no rodapé.

2. **CSS Scroll Snap e Centralização Estrita**:
   - Aplicação de `snap-x snap-mandatory overflow-x-auto scroll-smooth` no viewport do desenho.
   - Cada slide de página recebe `w-screen md:w-auto snap-center`, mantendo exatamente 1 página focada por vez no smartphone.
   - Ocultação do botão circular estático no mobile (`hidden md:flex`), eliminando o desvio lateral.

3. **Criação Dinâmica de Páginas ao Rolar para o Fim (Samsung Notes Flow)**:
   - Inclusão de um *trailing trigger slide* logo após a última página no mobile com feedback visual de transição ("Criando nova página...").
   - Detecção dupla da intenção de avanço através de:
     - `IntersectionObserver` monitorando a entrada do slide de gatilho no viewport móvel.
     - Detecção de sobre-rolagem (*overscroll / scroll threshold*) em eventos nativos de `scroll` e gestos multi-touch (`handleTouchMove`).
   - Disparo automático de `handleAddPage()` com debounce de 600ms para evitar criação acidental em rajada.
   - Avanço suave do índice ativo (`activePageIndex`) e da rolagem para a folha recém-gerada.

4. **Sincronização Reativa do Índice de Página**:
   - `IntersectionObserver` nas classes `.page-slide` atualiza dinamicamente `activePageIndex` conforme o usuário navega entre as páginas, mantendo os badges de numeração ("1 / 2", "2 / 2") rigorosamente sincronizados.

## Consequências
- **Positivas**:
  - Experiência móvel idêntica ao Samsung Notes: folha centralizada, aproveitamento integral da largura da tela e criação natural de páginas por deslize lateral.
  - Eliminação de botões intrusivos que quebravam o layout responsivo.
  - 100% de conformidade com os Quality Gates (testes unitários verdes e build de produção validado).
