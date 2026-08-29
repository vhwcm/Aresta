# Design Técnico: Motor 3D Realista de Virada de Página (Kindle Grade)

## 1. Visão Geral da Arquitetura

A nova engine de virada de página substitui a divisão em fatias DOM/CSS por uma arquitetura híbrida de alto desempenho:
1. **Camada Estacionária (Repouso)**: HTML5 Canvas 2D + DOM TextLayer nativos (zero custo de GPU contínuo, seleção de texto nativa, acessibilidade, grifos e dicionário).
2. **Camada Dinâmica de Folheio (WebGL / Three.js)**: Um `<canvas>` WebGL de alta resolução com malha de vértices contínua (ex: 64x64) controlado por `usePageCurl3D.ts` e `usePagePhysics.ts`. No momento do arrasto ou clique, o WebGL recebe as texturas pré-renderizadas da folha e executa a deformação contínua via shaders com sombras dinâmicas.

## 2. Diagrama Visual de Fluxo
Consulte o diagrama em: `diagrams/flow.txt`

## 3. Modelo Matemático da Deformação (GLSL Shaders)

### 3.1 Vértices e Projeção Conical / Cylindrical
Dada uma folha de largura $W$ e altura $H$:
- Origem da dobra: $P_0 = (x_0, y_0)$ (definida pelo ponto de início do toque).
- Ângulo de dobra: $\theta$ em relação ao eixo vertical.
- Raio de curvatura da crista: $R(y) = R_{\text{base}} + \alpha \cdot |y - y_0|$.
- Transformação de Vértice:
  - Para cada vértice $(x, y, z)$ da malha:
  - Se a distância perpendicular ao eixo de dobra $d < 0$, o ponto permanece plano (lado fixo).
  - Se $0 \le d < \pi \cdot R$, o ponto se curva ao longo do cilindro/cone com ângulo $\phi = d / R$:
    $$\begin{cases} x' = x_{\text{spine}} + R \cdot \sin(\phi) \cdot \cos(\theta) \\ y' = y + \text{offset}_y \\ z' = R \cdot (1 - \cos(\phi)) \end{cases}$$
  - Se $d \ge \pi \cdot R$, o ponto está no verso invertido da folha com translação e rotação completas de $180^\circ$.

### 3.2 Shading de Papel e Sombras Dinâmicas
- **Sombra na Folha de Baixo**: Projeção de sombra exponencial dependente do ângulo da dobra e distância da superfície $Z$.
- **Luz Especular Difusa**: Modelo Phong/Lambert atenuado simulando textura fosca de celulose.
- **Translucidez**: Blend de $8\%$ da textura do verso filtrada para a face frontal na crista iluminada.

## 4. Estrutura de Componentes e Composables

### 4.1 Composable `usePagePhysics.ts`
- Gerencia o estado de interação do ponteiro (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`).
- Calcula ponto de contato relativo, vetor de tração, velocidade de arrasto ($v_x, v_y$).
- Implementa animação de amortecimento elástico com física de mola (Spring Model: $F = -k \cdot x - c \cdot v$).

### 4.2 Composable `usePageCurl3D.ts`
- Inicializa e gerencia a instância `THREE.WebGLRenderer`, `THREE.PerspectiveCamera` ou `OrthographicCamera`, e a cena 3D.
- Constrói o `THREE.PlaneGeometry` com malha densa (64x64 segmentos).
- Cria o `THREE.ShaderMaterial` com uniforms: `uProgress`, `uCurlAngle`, `uCurlRadius`, `uFrontTexture`, `uBackTexture`, `uShadowIntensity`, etc.
- Atualiza as texturas dinamicamente a partir dos canvas do PDF/EPUB.
- Gerencia limpeza e `dispose()` de buffers e texturas para evitar memory leaks.

### 4.3 Componente `PageCurlCanvas.vue`
- Substitui as 4 fatias CSS por:
  - Camada de base estacionária (Páginas esquerda e direita em repouso).
  - Canvas Three.js sobreposto ativado exclusivamente durante o gesto ou animação.
  - Orquestração dos eventos de transição 0ms entre modo estático e 3D.

## 5. Tratamento de Erros & Fallbacks
- Fallback automático para transição 2D suave caso o navegador/dispositivo não suporte WebGL 2.0.
- Tratamento de perda de contexto WebGL (`webglcontextlost`) com restauração transparente (`webglcontextrestored`).

## 6. Estratégia de Testes
- **Testes Unitários**:
  - Testar `usePagePhysics.ts` para cálculos de progresso, detecção de flick e física de mola.
  - Testar ciclo de vida, texturização e desalocação do `usePageCurl3D.ts`.
- **Validação Manual & Visual**:
  - Garantir ausência de listras verticais em todos os temas.
  - Testar arrasto de cantos superior, inferior e lateral a 60/120 FPS.
