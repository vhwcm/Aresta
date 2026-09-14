# ADR-014: Cache Híbrido em Memória no Backend e Estratégia SWR no Frontend para Dados Iniciais

## Status
Aceito

## Contexto
Ao acessar o Aresta (Dashboard/Home, Estante, Grafo de Conhecimento, Notas e Revisão Diária), múltiplas consultas ao banco de dados PostgreSQL eram disparadas simultaneamente para montar dados estruturais e metadados que raramente sofrem alterações a cada fração de segundo:
1. Grafo de Conhecimento (`getGraph` com agregações de temas, livros, notas, quadros e anotações).
2. Estante de Livros (`findByUser` com temas e metadados públicos).
3. Notas e Anotações (`getAllByUser` e `findByUser`).
4. Flashcard do Dia (`getDailyDeck`).

Isso gerava carga desnecessária no banco de dados e introduzia latência visual (spinners de carregamento e potenciais layout shifts) na abertura da aplicação e na alternância entre abas.

## Decisão
Adotar uma arquitetura de cache em duas camadas (Full-Stack Híbrido SWR):

1. **Backend (`apps/api`) — In-Memory CacheManager com Invalidação por Tags**:
   - Criação de um singleton `CacheManager` com TTL padrão de 10 minutos e eviction LRU.
   - Indexação por tags de usuário (`user:${userId}:books`, `user:${userId}:graph`, `user:${userId}:annotations`, `user:${userId}:flashcards`, `user:${userId}:notes`).
   - Invalidação reativa automática acionada em todas as operações de mutação (atualização de progresso de leitura, criação de notas/anotações, edição de temas/nós e revisão de flashcards).

2. **Frontend (`apps/web`) — SWR com Estado Compartilhado e Hidratação Local**:
   - Elevação do estado reativo nos composables (`useUserBooks`, `useGraph`, `useAnnotations`, `useFlashcards`) para singletons a nível de módulo.
   - Hidratação imediata a partir do IndexedDB/armazenamento local (0ms de latência percebida).
   - Revalidação em segundo plano sem ativação de spinners de bloqueio quando dados em cache já estão presentes.

## Consequências
- **Positivas**:
  - Renderização instantânea (0ms) na tela inicial, estante, notas e grafo.
  - Eliminação de spinners intrusivos ao transitar entre abas.
  - Redução drástica de consultas ao PostgreSQL para navegações de leitura/consulta.
  - Consistência total em tempo real garantida pela invalidação seletiva por eventos.
- **Negativas / Mitigações**:
  - O cache backend reside na memória do processo Node.js; em caso de reinicialização da API, o cache é reconstruído no primeiro acesso sem qualquer perda de dados persistidos.
