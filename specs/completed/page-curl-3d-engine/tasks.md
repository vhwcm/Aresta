# Tarefas de Implementação: Motor 3D Realista de Virada de Página (Kindle Grade)

## Checklist de Execução

- [x] **1. Composable de Física Gestual (`usePagePhysics.ts`)**
  - [x] 1.1 Implementar captura e cálculo de vetores de toque/arraste do ponteiro.
  - [x] 1.2 Implementar lógica de deformação por ponto de contato (cantos superiores, inferiores e laterais).
  - [x] 1.3 Implementar detecção de velocidade/flick e simulação de mola elástica (Spring Physics).

- [x] **2. Motor 3D e Shaders de Deformação WebGL (`usePageCurl3D.ts`)**
  - [x] 2.1 Criar inicializador Three.js com malha contínua subdividida (`PlaneGeometry`).
  - [x] 2.2 Desenvolver GLSL Vertex Shader com deformação cônica/cilíndrica sem emendas.
  - [x] 2.3 Desenvolver GLSL Fragment Shader com sombras dinâmicas de contato, brilho de papel e translucidez.
  - [x] 2.4 Implementar pipeline de textura offscreen para páginas do PDF/EPUB.
  - [x] 2.5 Implementar gerenciamento eficiente de memória GPU e ciclo de vida (`dispose`).

- [x] **3. Refatoração do Componente `PageCurlCanvas.vue`**
  - [x] 3.1 Remover todo o fatiamento CSS antigo (`mesh-segment--0..3`, `slice-inner`, etc.).
  - [x] 3.2 Integrar o Canvas WebGL sobreposto acionado pelos composables.
  - [x] 3.3 Integrar transição 0ms entre o modo estacionário nativo e o modo de virada 3D.
  - [x] 3.4 Validar suporte a 1 página (mobile) e 2 páginas (desktop) com temas Claro, Escuro e Sépia.

- [x] **4. Testes Automatizados e Validação Visual**
  - [x] 4.1 Criar testes unitários para `usePagePhysics.ts` e `usePageCurl3D.ts`.
  - [x] 4.2 Executar testes unitários com Vitest no frontend (277 testes passando).
  - [x] 4.3 Validar ausência de listras verticais e fluidez a 60/120 FPS.

- [x] **5. Documentação & Conclusão**
  - [x] 5.1 Atualizar `docs/architecture/` com a nova engine 3D.
  - [x] 5.2 Executar a skill `review-consistency`.
  - [x] 5.3 Mover spec para `specs/completed/`.
