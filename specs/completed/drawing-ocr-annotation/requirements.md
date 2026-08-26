# Requisitos: Anotações com Painel Expandido de Escrita Manual e OCR

## 1. Objetivo Geral
Permitir que os usuários, durante a leitura de livros no Aresta, possam redigir anotações em um painel expandido (50% da largura em desktop/tablet ou tela inteira em mobile) utilizando digitação tradicional ou desenho manual (touch, caneta stylus ou mouse). Caso a escrita manual seja utilizada, a imagem dos traços é enviada ao microsserviço de OCR (`aresta-ocr`) via backend para ser transcrita em texto e salva diretamente como anotação no banco de dados.

---

## 2. Escopo

- **Incluído**:
  - Botão de expansão para tela/painel lateral na modal de anotação (`ReaderAnnotationModal.vue`).
  - Painel lateral deslizante/drawer ocupando 50% em Desktop/Tablet (permitindo leitura simultânea) e 100% em Mobile.
  - Alternador de modo de entrada: Digitação (textarea) vs. Desenho manual (HTML5 Canvas).
  - Canvas de desenho com suporte a touch, mouse e stylus com ferramentas essenciais: Caneta (com espessura ajustável), Borracha, Desfazer (Undo) e Limpar Tudo.
  - Orquestração no backend Node.js (`aresta-back-node`) com cliente gRPC para invocar o microsserviço `aresta-ocr`.
  - Endpoint `POST /api/annotations/with-ocr` (e `POST /api/ocr/transcribe`) para receber a imagem em base64, processar OCR e salvar a anotação com os temas do Grafo vinculados.
  - Tratamento de erro resiliente: caso o OCR falhe ou esteja indisponível, exibir alerta ao usuário e preservar o desenho no canvas para nova tentativa ou troca para texto digitado sem perda de dados.
  - Descarte do buffer/imagem do desenho após o salvamento bem-sucedido (persistindo somente o texto transcrito).

- **Não Incluído**:
  - Armazenamento persistente de imagens brutas de traços no banco de dados.
  - Editor gráfico avançado de camadas ou filtros de imagem.

---

## 3. Requisitos Funcionais

### R1. Expansão para Painel Lateral de Escrita (Drawer)
- **Descrição**: O leitor de livros deve fornecer na modal de anotações uma opção clara para abrir o Painel Lateral Expandido de Escrita.
- **Comportamento**: 
  - Em telas Desktop e Tablet (`>= 768px`), o painel abre na lateral ocupando 50% da largura da viewport, mantendo o texto do livro visível ao lado.
  - Em telas Mobile (`< 768px`), o painel ocupa 100% da tela.
- **Atores**: Usuário Leitor.
- **Regra de Validação**: O texto selecionado (citação), temas do grafo selecionados e página corrente permanecem sincronizados entre a modal compacta e o painel expandido.

### R2. Alternância de Modo (Digitação vs. Desenho Manual)
- **Descrição**: O painel expandido deve oferecer botões visuais para comutar entre:
  1. *Modo Digitação*: Área de texto expansível com foco amigável ao teclado.
  2. *Modo Desenho*: Canvas interativo de desenho manual.
- **Atores**: Usuário Leitor.
- **Regra de Validação**: O usuário pode alternar entre os modos a qualquer momento.

### R3. Canvas de Escrita e Ferramentas
- **Descrição**: O canvas de desenho deve fornecer resposta fluida a eventos de toque, caneta stylus e ponteiro do mouse.
- **Ferramentas**:
  - Caneta com opções de espessura (Fina, Média, Grossa).
  - Borracha para apagar traços.
  - Desfazer (Undo) para reverter o último traço.
  - Limpar Tudo (com confirmação ou fácil reversão).
- **Atores**: Usuário Leitor.
- **Regra de Validação**: Canvas deve exportar imagem nítida com fundo branco/transparente e traços escuros otimizados para OCR.

### R4. Orquestração de OCR no Backend via gRPC
- **Descrição**: Ao salvar com o modo Desenho ativo, o frontend envia a imagem gerada no Canvas via API REST para o `aresta-back-node`. O backend chama o serviço gRPC `aresta-ocr` (`OcrService.ExtractText`) para obter a transcrição em texto.
- **Atores**: Backend Node.js / Microsserviço `aresta-ocr`.
- **Regra de Validação**: Imagem vazia ou sem traços deve ser rejeitada com erro amigável. Caso o OCR retorne vazio ou erro, o backend responde com código HTTP apropriado.

### R5. Persistência Direta da Anotação
- **Descrição**: O backend insere a anotação no banco com o texto retornado pelo OCR no campo `note`, associando o `bookId`, `cfi`, `selectedText`, `chapterTitle` e temas (`themeIds`), retornando o objeto da anotação criada.
- **Atores**: Backend Node.js / Prisma ORM.

### R6. Tratamento de Erros e Preservação do Desenho
- **Descrição**: Caso o microsserviço de OCR falhe (timeout, queda de serviço ou traço não reconhecido), o frontend não deve fechar o painel nem limpar o canvas, exibindo toast/banner com a mensagem de erro.
- **Atores**: Frontend Nuxt/Vue.

---

## 4. Requisitos Não Funcionais

- **Performance**: Renderização a 60fps no Canvas sem travamento nos traços. Latência de transcrição OCR otimizada (< 2s em condições normais de rede/Gemini).
- **Segurança**: Endpoint de anotação com OCR protegido por autenticação JWT / `optionalAuthenticate`.
- **Compatibilidade**: Suporte a touch devices (smartphones, iPads, tablets Android) e desktop (Chrome, Firefox, Safari, Edge).

---

## 5. Critérios de Aceite

- [ ] Usuário consegue abrir o painel expandido de anotações no leitor tanto em desktop (50%) quanto em mobile (100%).
- [ ] Usuário consegue desenhar livremente no canvas com caneta, apagar com borracha, desfazer traços e limpar o canvas.
- [ ] Ao clicar em "Salvar Anotação" no modo desenho, o canvas é convertido para imagem e enviado ao endpoint `POST /api/annotations/with-ocr`.
- [ ] O `aresta-back-node` se conecta via gRPC ao `aresta-ocr`, recebe a transcrição e persiste a anotação no PostgreSQL via Prisma.
- [ ] A anotação criada é exibida na lista de anotações e conectada aos temas do Grafo.
- [ ] Se o serviço de OCR falhar, uma mensagem de erro é exibida e o desenho permanece intacto no Canvas.
