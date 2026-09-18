# ADR-020: Modo de Leitura Scroll Contínuo Vertical para PDF e EPUB

## Status
Aceito e Implementado

## Data
2026-09-18

## Contexto
O leitor do Aresta (`apps/web/app/components/reader/`) operava tradicionalmente com um motor 3D de virada de páginas (`PageCurlCanvas.vue`), simulando a física de folhas de papel para documentos PDF e EPUB.

Embora a virada de página seja sensorialmente rica para certos tipos de leitura, muitos usuários e cenários de estudo e pesquisa exigem uma experiência de leitura contínua e vertical (scroll contínuo):
1. **Documentos Técnicos e Acadêmicos (PDF)**: Leitura de artigos com gráficos e tabelas verticais que demandam rolagem fluida sem quebras rígidas de página.
2. **Leitura Dinâmica de EPUB**: Livros em formato reflowable são naturalmente fluidos. Dividi-los artificialmente em páginas estáticas de tamanho fixo interrompia parágrafos no meio de frases e dificultava a leitura rápida.
3. **Ergonomia e Acessibilidade**: Rolagem contínua via trackpad, mouse wheel ou toque é o padrão de produtividade moderno em aplicações como Kindle, Foliate e Readwise Reader.

## Decisão

1. **Padrão Strategy e Motor Dedicado (`ReaderScrollEngine.vue`)**:
   - Isolamento da lógica de rolagem vertical contínua em um componente dedicado (`ReaderScrollEngine.vue`) e composable desacoplado (`useReaderScroll.ts`).
   - O `Viewer.vue` atua como Contexto, alternando dinamicamente entre `ReaderEnginePageCurlCanvas.vue` e `ReaderScrollEngine.vue` com base no estado `store.readingMode` (`'paginated'` ou `'scroll'`).

2. **Virtualização Eficiente de PDF com Dimensões Reais**:
   - Cada página do PDF é posicionada em um slot com aspect-ratio proporcional calculado antecipadamente, garantindo que a barra de rolagem represente o documento inteiro com total exatidão.
   - Um `IntersectionObserver` com margem de buffer (600px) gerencia o conjunto `visiblePages`. Apenas páginas no campo de visão renderizam elementos `<canvas>` e `textLayer`, desalocando-os ao sair da tela para prevenir estouro de memória GPU/RAM em documentos longos (500+ páginas).

3. **Fluxo Natural Reflowable para EPUB (Continuous Sections)**:
   - Implementação de `renderSectionContinuous(sectionIndex, container)` no `EpubDocumentAdapter`.
   - Os capítulos do EPUB são renderizados em sequência vertical contínua em HTML nativo com tipografia ajustável (Newsreader, Literata, Inter, entrelinha `1.75`), sem divisões artificiais de colunas que quebrem parágrafos.
   - Observadores rastreiam as seções em visualização para atualizar a página global correspondente (`getPageForSection`).

4. **Sincronização de Posição e Atalhos de Navegação**:
   - Um observador de baseline na altura do terço superior da viewport (`-15% 0px -70% 0px`) atualiza reativamente `store.currentPage` e o progresso percentual conforme a rolagem progride.
   - Ao alternar entre modo Páginas e modo Scroll, a página atual é preservada em ambas as direções.
   - Suporte completo a atalhos de teclado ergonômicos de rolagem (`PageDown`, `PageUp`, `Espaço`, `Shift+Espaço`, `Setas`, `Home`, `End`).
   - Ocultação das setas flutuantes laterais no modo scroll para leitura limpa e imersiva.

5. **Paridade com Recursos de Estudo e Temas**:
   - Suporte total a seleção de texto e tooltip de ações contextuais (Anotar, Dicionário Offline, Explicação IA, Criar Livreto).
   - Renderização e persistência de destaques coloridos (`highlights`) diretamente nas camadas de texto de páginas PDF e seções EPUB.
   - Suporte completo a temas visuais (Amarelado/Sépia, Branco, Preto/Noturno), larguras (Centralizado e Largo) e Modo Zen.

6. **Persistência de Preferências**:
   - A preferência do usuário é sincronizada via `localStorage` (`aresta_reading_mode`) e `useSettings` (`readerReadingMode`), mantendo o leitor no modo escolhido entre sessões.

## Consequências

### Positivas
- Experiência de leitura moderna, ininterrupta e extremamente ágil para PDFs e EPUBs.
- Baixo consumo de recursos e alta performance através de virtualização com `IntersectionObserver`.
- Código limpo e manutenível via Padrão Strategy, sem acoplamento entre os motores de 3D flip e scroll.
- 100% de paridade de anotações, destaques, IA e dicionário em ambos os modos.

### Custos e Riscos
- A renderização contínua de seções de EPUB muito longas demanda lazy mounting de seções para evitar nós DOM excessivos em livros com poucos capítulos muito extensos.
