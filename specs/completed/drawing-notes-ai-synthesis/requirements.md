# Requisitos: Notas de Desenho Paginadas com Rejeição de Palma e Síntese em HTML Semântico via IA

## 1. Objetivo Geral
Implementar um novo tipo de anotação no ecossistema Aresta dedicado a desenho livre e escrita manuscrita digital em páginas estruturadas (estilo Samsung Notes), munido de alta precisão vetorial (`perfect-freehand`), suporte a múltiplos estilos de caneta (esferográfica, caligráfica, lápis, marca-texto translúcido, borracha), rejeição inteligente de palma via Pointer Events API (diferenciando stylus/caneta de toques de mão/dedo) e capacidade de síntese multimodal com IA (Gemini Vision) para transformar o que foi desenhado em uma página HTML semântica pura com CSS moderno (cards visuais, cabeçalhos, listas, fluxogramas hierárquicos e tabelas), visualizável em split preview com opção de conversão em Nota padrão e descarte/exclusão opcional do desenho original.

## 2. Escopo
- **Incluído**:
  - Nova entidade de primeira classe `DrawingNote` no Prisma com versionamento estrito de migration SQL.
  - Endpoints REST completos no backend para listagem, criação, leitura, atualização contínua (autosave debounce) e deleção de notas de desenho (`/api/drawings`).
  - Endpoint de síntese por IA multimodal (`/api/drawings/:id/synthesize`) que converte imagens das páginas desenhadas em HTML semântico com CSS moderno.
  - Integração no hub `/canvas` de uma nova aba "Desenhos" ao lado de "Quadros" e "Notas", com cards de pré-visualização e contagem de páginas.
  - Editor dedicado paginado estilo Samsung Notes com proporção A4, rolagem vertical contínua, botão para adicionar/remover páginas, seleção de papéis de fundo (em branco, pautado, quadriculado, pontilhado).
  - Engine de desenho fluida com suporte à pressão de caneta, estilos de caneta (esferográfica, caligráfica, lápis, marca-texto), seletor de cores, espessuras e histórico ilimitado de desfazer/refazer.
  - Rejeição de palma ativa (quando caneta/stylus é detectada ou por modo stylus estrito, ignorando toques acidentais da mão).
  - Modal interativo de visualização com split (desenho vs HTML sintetizado), permitindo salvar como Nota padrão e opcionalmente remover o desenho de origem.
- **Não Incluído**:
  - Reconhecimento de formas em tempo real com auto-snapping (rectângulos perfeitos imediatos no traço) — a estruturação de caixas e diagramas é delegada para a síntese semântica da IA.
  - Modos de visualização horizontal / flipbook.

## 3. Requisitos Funcionais

### R1. Modelo de Dados e Persistência de Desenho
- **Descrição**: O sistema deve persistir notas de desenho como registros individuais vinculados ao usuário autenticado, armazenando título, pasta, tags, páginas (em JSON com dimensões, plano de fundo e traços vetoriais) e thumbnail de visualização rápida.
- **Atores**: Usuário Autenticado, Sistema.
- **Regra de Validação**: Cada desenho deve possuir pelo menos 1 página; páginas contêm id, pageNumber, backgroundType e array de strokes com points (x, y, pressure).

### R2. Rejeição de Palma e Ferramentas de Caneta
- **Descrição**: O editor deve monitorar `pointerType` nos eventos da tela (`PointerEvent`). Ao detectar entrada de tipo `'pen'`, toques de dedo e contato largo da palma da mão (`pointerType === 'touch'`) são ignorados para desenho (mantendo apenas gestos de 2 dedos para scroll).
- **Atores**: Usuário Autenticado (via caneta Stylus, Apple Pencil, S-Pen ou mouse/touch).
- **Regra de Validação**: O usuário pode alternar entre Caneta, Lápis, Marca-texto, Borracha, ajustar cores e espessura do traço e alternar modo de rejeição de palma.

### R3. Organização Paginada Contínua
- **Descrição**: As anotações de desenho devem ser organizadas em páginas verticais independentes com visual A4, numeração de página, botão de adicionar página e troca de fundo de folha (liso, pautado, quadriculado, pontilhado).
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: Exclusão de página com confirmação quando houver mais de uma; rolagem suave entre páginas.

### R4. Síntese Semântica Multimodal com IA
- **Descrição**: O usuário pode acionar "Transformar com IA". O editor exporta as páginas do canvas em imagens de alta resolução e envia para o backend. O backend utiliza Gemini Vision com prompt rigoroso para gerar HTML semântico puro com CSS estilizado (cards, headers, tópicos, listas, tabelas e caixas hierárquicas representando os diagramas desenhados).
- **Atores**: Usuário Autenticado, AiService.
- **Regra de Validação**: O HTML gerado deve ser limpo, autocontido, responsivo e sem tags markdown cruas ou código não fechado.

### R5. Visualizador Split e Conversão em Nota
- **Descrição**: O HTML gerado é exibido em uma gaveta/modal com split (desenho original ao lado do HTML formatado). O usuário pode descartar, copiar, ou "Salvar como Nota", com a opção de excluir o desenho original ou mantê-lo.
- **Atores**: Usuário Autenticado.
- **Regra de Validação**: Se marcado para excluir, a nota de desenho original é deletada após a criação com sucesso da nova `Note`.

### R6. Hub Unificado no Espaço Criativo
- **Descrição**: A página `/canvas` passa a oferecer as abas "Todos", "Quadros", "Notas" e "Desenhos". Botão de criação "+ Novo Desenho" cria uma nova nota de desenho e redireciona para seu editor.
- **Atores**: Usuário Autenticado.

## 4. Requisitos Não Funcionais
- **Performance**: Latência de inking < 16ms (60-120fps) via Canvas 2D e `requestAnimationFrame`. Autosave com debounce de 1500ms e backup imediato local.
- **Segurança**: Endpoints protegidos com autenticação JWT; propriedade de `user_id` estrita em todas as operações de banco.
- **Compatibilidade**: Suporte a touch e stylus em navegadores modernos e aplicação desktop/mobile Tauri v2.

## 5. Critérios de Aceite
- [ ] Migration Prisma versionada em SQL criando a tabela `drawing_notes` com FK cascade para `users`.
- [ ] Testes unitários do módulo backend de drawings (CRUD, permissões, sanitização e síntese).
- [ ] Inking suave com caneta, lápis, marca-texto e borracha sem delay perceptível.
- [ ] Rejeição de palma funcional ignorando toques indesejados quando em modo caneta.
- [ ] Exportação de páginas e síntese via Gemini retornando HTML semântico puro estilizado.
- [ ] Modal de split view funcionando com opções de "Salvar como Nota" e "Excluir desenho original".
- [ ] Abas e filtros atualizados no `/canvas` refletindo Quadros, Notas e Desenhos perfeitamente.
