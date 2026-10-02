# ARESTA Design System: Arquitetura "Editorial Premium"

Este documento descreve a linguagem visual e os princípios de design do produto ARESTA. O objetivo é afastar a plataforma do aspeto de um "dashboard genérico de gestão" e assumir a postura de um ambiente intelectual de alta concentração e estética premium (inspirado em Linear, Vercel e publicações editoriais digitais).

## 1. Princípios de Arquitetura de Interface

O segredo do layout premium não está em adicionar elementos, mas sim em removê-los.

*   **Borderless Design (Fim das "Caixas"):** Abandone o padrão de colocar conteúdos (cards do feed, livros) dentro de blocos com border ou bg-gray-800. O conteúdo deve flutuar diretamente no fundo da aplicação (o Canvas).
*   **Negative Space (Respiro Massivo):** Use margens (margin) e paddings (padding) gigantes. Os elementos não devem "tocar-se". Espaçamentos de 48px a 96px (Tailwind `gap-12` a `gap-24`) entre secções são o padrão.
*   **Separadores Elegantes:** Para dividir secções de conteúdo, use linhas horizontais extremamentes finas (1px) com opacidade quase invisível (`rgba(255,255,255,0.06)`). Nunca use caixas sólidas para agrupar conteúdo.
*   **Zero Blur & Superfícies Sólidas (Fim do Glassmorphism Desfocado):** Aresta é estritamente minimalista. É terminantemente proibido o uso de filtros de desfoque (`backdrop-blur-*`, `filter: blur()`) e efeitos artificiais de vidro translúcido em popovers, modais, headers e painéis flutuantes. Todos os componentes devem apresentar fundos sólidos e opacos (`bg-bgPanel`, `bg-bgRoot`, `bg-bgSurface`), delimitados por bordas finas nítidas de 1px (`border-divider`) e sombras profundas controladas (`shadow-xl` / `shadow-2xl`).

## 2. Paleta de Cores "Deep Dark" (Ultra-Contraste)

A paleta abandona os cinzentos médios vulgares e abraça os pretos profundos absolutos para criar uma sensação de profundidade e contraste dramático com os textos brancos puros.

*   **Fundo Global (bgApp):** `#0A0A0B` (Um preto denso e profundo, o vácuo onde a informação vive).
*   **Fundo de Painéis Secundários (bgPanel):** `#121315` (Um preto ligeiramente mais claro para a Nav Rail, popovers e modais flutuantes, sempre 100% opaco e sólido).
*   **Texto Primário (textPrimary):** `#F2F2F2` (Quase branco. Evite #FFFFFF puro para não cansar a vista).
*   **Texto Secundário (textSecondary):** `#7A7D84` (Cinzento neutro e elegante para metadados e legendas).
*   **Cor de Destaque (accent):** `#E57B55` (Um Laranja vibrante. Usado com extrema parcimónia, apenas para botões cruciais, as "arestas" do grafo e ícones de IA. Funciona como a única faísca de cor no ecrã escuro).
*   **Linhas Divisórias (divider):** `rgba(255, 255, 255, 0.06)` (Linhas subtis de separação).

## 3. Tipografia (A Estrela do Layout)

O design apoia-se num contraste violento entre as fontes. Se a tipografia falhar, a estética "premium" desaba.

### A. Fonte de Interface (A Navegação)
Usada apenas para botões, menus e descrições técnicas.
*   **Família:** Inter (ou San Francisco, Geist Sans).
*   **Peso:** Regular (400) a Medium (500). Sem grandes pesos de negrito (Bold).

### B. Fonte Editorial (A Alma Intelectual)
Usada para Títulos gigantes, citações de livros, conteúdo do Feed Diário e respostas longas da IA. O contraste desta fonte com o fundo escuro é o que dá a "vibe editorial".
*   **Família:** Newsreader (ou Merriweather, Playfair Display).
*   **Tamanho e Peso:** Títulos enormes (`text-4xl`, `text-5xl`) e, incrivelmente importante, peso fino (Light/300). Títulos gigantes em negrito parecem publicidade de varejo; títulos gigantes e finos parecem capas da Vogue ou da The New Yorker.

### C. Fonte Técnica (As Etiquetas)
Usada para rótulos de categorização, meta-dados e os comandos de atalho de teclado (Cmd+K).
*   **Família:** JetBrains Mono (ou Fira Code, Roboto Mono).
*   **Estilo Rigoroso:** Sempre em maiúsculas (uppercase), tamanho microscópico (`text-[10px]` ou 11px), peso forte (`font-semibold`) e espaçamento entre letras absurdo (`tracking-widest` ou `letter-spacing: 0.2em`). Isto cria a estética de uma ferramenta técnica de precisão.

## 4. O Fluxo Visual das Secções (Anatomia do Ecrã)

### I. A Nav Rail (A Navegação Minimalista)
*   Fixa à esquerda. Estreita (ex: 64px de largura).
*   Sem textos. Apenas ícones minimalistas (estilo lucide-react) perfeitamente centralizados e alinhados verticalmente com grande espaço entre eles.
*   Ícone ativo tem a cor invertida (`bg-white text-black`), enquanto os inativos são cinzentos opacos (`opacity-40`).

### II. O Stream Central (O Feed)
*   É a área principal (`flex-1`).
*   Os conteúdos (cards de leitura, ligações da IA, flashcards) vivem soltos sobre o fundo `#0A0A0B`.
*   A separação entre eles faz-se com a linha divisória de 1px.
*   O "Input de Pesquisa" no topo da página deve parecer texto flutuante com um ícone, e não um formulário quadrado com bordas fortes.

### III. O Grafo Interativo (O Painel Vidrado)
*   Fixo à direita.
*   O fundo não é uma cor sólida, mas sim um canvas com um grid pontilhado técnico (Background pattern com pequenos pontos cinzentos).
*   Fundo inferior desvanece (Fade out / Gradient-to-top) para preto sólido na base onde residem as legendas, criando profundidade e permitindo que o texto descritivo seja lido sobre o desenho do grafo complexo que corre por trás.

### IV. A Command Palette (Modal Minimalista Sólido)
*   Quando o utilizador pressiona Ctrl+K:
*   O fundo da aplicação escurece com overlay escuro (`bg-black/70`), sem filtros artificiais de desfoque.
*   O painel central é sólido e opaco (`bg-bgPanel`), com borda sutil (`border-divider`) e sombra profunda (`shadow-2xl`), garantindo contraste perfeito para leitura imediata sem interferência de elementos subjacentes.
*   O input de texto não tem qualquer borda. Texto elegante e direto (Inter Regular/Medium). Sem botões de "Procurar"; funciona exclusivamente ao pressionar Enter.

## 5. Componentes de Interface & Seletores Customizados

### `AppSelect.vue` (Seletor Minimalista & Editorial)
Substitui o elemento nativo HTML `<select>` (que quebra a imersão com o popover padrão do sistema operacional) por um menu flutuante alinhado à estética "Deep Dark":
*   **Trigger Elegante:** Fundo `bg-bgPanel` com borda sutil `border-divider`, cantos arredondados (`rounded-xl`), ícone de chevron que rotaciona suavemente (180°) e tipografia `font-interface text-xs`. Suporte a ícone de contexto (ex: `BookOpenIcon`) e contadores numéricos estilizados como chips (`font-technical text-[10px]`).
*   **Menu Flutuante:** Fundo escuro fosco sólido `bg-bgPanel`, borda delimitadora `border-divider`, sombra profunda (`shadow-2xl`), scroll customizado e animação suave de abertura, sem qualquer desfoque de fundo.
*   **Busca em Tempo Real:** Campo de busca integrado quando o seletor possui mais de 6 opções ou quando explicitamente ativado (`searchable`), permitindo filtrar rapidamente centenas de obras ou itens.
*   **Acessibilidade & Atalhos:** Suporte a fechar com tecla `Escape`, navegação via setas do teclado (`ArrowDown`, `ArrowUp`, `Enter`) e detecção de clique externo para fechamento automático.

## 6. Paleta de Cores "Light Mode" (Alto Contraste & Ergonomia)

Para garantir máxima legibilidade em ambientes iluminados sem perder a sofisticação editorial, o modo claro estrutura-se em camadas tonais distintas em conformidade com WCAG AA:

*   **Fundo Global (bgApp):** `#F8F9FA` (Cinza-gelo suave que elimina o ofuscamento do branco puro e cria base contrastante para os elementos).
*   **Campos Rebaixados e Inputs (bgRoot):** `#F1F3F5` (Proporciona encaixe tátil para barras de busca e áreas rebaixadas).
*   **Paineis, Folhas e Modais (bgPanel):** `#FFFFFF` (Branco puro para cartões de notas, documentos e folhas de leitura, destacando-se sobre o fundo).
*   **Superfícies de Ação (bgSurface):** `#F8F9FA` (Botões secundários e barras de ferramentas com separação suave).
*   **Texto Primário (textPrimary):** `#111827` (Slate-900 sólido, contraste ~15:1 contra o branco).
*   **Texto Secundário (textSecondary):** `#4B5563` (Slate-600 sólido, legível sem esforço em legendas e metadados).
*   **Divisores e Bordas (divider):** `#E2E8F0` (Delimitação limpa de 1px entre sidebar, cards e área de trabalho).
*   **Badges Semânticas:**
    *   **Quadro:** `bg-amber-50 dark:bg-accent/10 text-amber-700 dark:text-accent/90 border border-amber-200 dark:border-accent/20`
    *   **Nota:** `bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400/90 border border-indigo-200 dark:border-indigo-500/20`
    *   **Síntese IA:** `bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25`

## 7. Diretriz de Design: Minimalismo Estrito, Superfícies Sólidas e Política "Zero Blur"

A filosofia visual do monólito Aresta repousa sobre a clareza, a austeridade editorial e o foco mental absoluto. O uso de artifícios visuais supérfluos — em especial o *glassmorphism* com filtros de desfoque (`backdrop-blur-*` ou `filter: blur()`) — foi formalmente descontinuado e banido da interface.

### 7.1. Princípios Inegociáveis Anti-Blur

1. **Opacidade 100% em Painéis e Popovers:**
   - Nenhum menu suspenso, popover de ferramentas (incluindo o popup de ofensiva), modal de diálogo ou gaveta lateral deve utilizar classes `backdrop-blur-*` ou fundos semitransparentes.
   - O fundo deve ser sempre sólido (`bg-bgPanel` ou `bg-bgRoot`). Isto elimina completamente manchas difusas, halos luminosos ou textos subjacentes (como nós do Grafo de Conhecimento ou itens da árvore de pastas) sangrando para o primeiro plano.

2. **Contraste Tipográfico Imediato:**
   - O usuário não deve despender esforço cognitivo tentando decifrar números, métricas ou títulos sobrepostos a elementos de fundo desfocados.
   - A tipografia de interface (`font-interface`), técnica (`font-technical`) e editorial (`font-editorial`) exige contraste imediato contra superfícies limpas e escuras/claras puras.

3. **Performance Multiplataforma (Local-First, Web, Desktop & Mobile):**
   - O filtro CSS `backdrop-filter: blur(...)` exige composições gráficas contínuas da GPU a cada novo frame (animação de zoom do grafo, drag-and-drop, movimentação de nós ou transições).
   - Em dispositivos móveis Android (via WebView Tauri) e notebooks operando em bateria, o blur acarreta *jank* (queda de FPS), atraso na renderização e alto consumo de energia.
   - A adoção de superfícies sólidas com bordas nítidas de 1px (`border-divider`) e sombras precisas (`shadow-xl` / `shadow-2xl`) garante taxa constante de 60 a 120 FPS.

4. **Enquadramento Ergonômico e Não-Corte de Popovers:**
   - Todo elemento flutuante ancorado a botões ou sidebars deve respeitar os limites físicos da viewport:
     - **Prevenção de corte horizontal:** Gatilhos localizados próximos à extremidade esquerda da tela (como a barra lateral `FolderTagSidebar`) devem ancorar o popover para dentro da área visível (`md:left-0 md:right-auto`), impedindo que coordenadas negativas empurrem conteúdo para fora da tela.
     - **Prevenção de corte vertical:** Popovers ricos em informações devem declarar teto de altura relativo à viewport (`max-h-[calc(100vh-5rem)]`) acompanhado de rolagem interna suave (`overflow-y-auto`), evitando corte do rodapé em telas de notebook (768px de altura) ou tablets.


