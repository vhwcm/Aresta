# ARESTA Design System: Arquitetura "Editorial Premium"

Este documento descreve a linguagem visual e os princípios de design do produto ARESTA. O objetivo é afastar a plataforma do aspeto de um "dashboard genérico de gestão" e assumir a postura de um ambiente intelectual de alta concentração e estética premium (inspirado em Linear, Vercel e publicações editoriais digitais).

## 1. Princípios de Arquitetura de Interface

O segredo do layout premium não está em adicionar elementos, mas sim em removê-los.

*   **Borderless Design (Fim das "Caixas"):** Abandone o padrão de colocar conteúdos (cards do feed, livros) dentro de blocos com border ou bg-gray-800. O conteúdo deve flutuar diretamente no fundo da aplicação (o Canvas).
*   **Negative Space (Respiro Massivo):** Use margens (margin) e paddings (padding) gigantes. Os elementos não devem "tocar-se". Espaçamentos de 48px a 96px (Tailwind `gap-12` a `gap-24`) entre secções são o padrão.
*   **Separadores Elegantes:** Para dividir secções de conteúdo, use linhas horizontais extremamentes finas (1px) com opacidade quase invisível (`rgba(255,255,255,0.06)`). Nunca use caixas sólidas para agrupar conteúdo.

## 2. Paleta de Cores "Deep Dark" (Ultra-Contraste)

A paleta abandona os cinzentos médios vulgares e abraça os pretos profundos absolutos para criar uma sensação de profundidade e contraste dramático com os textos brancos puros.

*   **Fundo Global (bgApp):** `#0A0A0B` (Um preto denso e profundo, o vácuo onde a informação vive).
*   **Fundo de Painéis Secundários (bgPanel):** `#121315` (Um preto ligeiramente mais claro para a Nav Rail e modais flutuantes).
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

### IV. A Command Palette (Glassmorphism Modal)
*   Quando o utilizador pressiona Ctrl+K:
*   O fundo da aplicação escurece levemente (`bg-black/40`) e desfoca agressivamente (`backdrop-blur-md`).
*   O painel central não é opaco. Tem a cor `rgba(18, 19, 21, 0.85)` com desfoque de fundo (Glassmorphism), criando um aspeto luxuoso e nativo de sistemas operacionais modernos (estilo macOS).
*   O input de texto não tem qualquer borda. Texto gigante e leve (Inter Light). Sem botões de "Procurar"; funciona exclusivamente ao pressionar Enter.
