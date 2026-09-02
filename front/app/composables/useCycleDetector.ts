export interface RenderContextItem {
  type: 'note' | 'canvas';
  id: string;
  title?: string;
}

export const MAX_COMPOSITE_DEPTH = 3;

export function useCycleDetector(currentStack: RenderContextItem[] = []) {
  /**
   * Verifica se a inclusão de um recurso (note ou canvas) cria um ciclo de dependência
   * ou se excede a profundidade máxima de aninhamento segura.
   */
  const checkCycle = (
    targetType: 'note' | 'canvas',
    targetId: string
  ): { hasCycle: boolean; maxDepthReached: boolean; cycleChain: string[] } => {
    // 1. Checagem de ciclo nos ancestrais (Prioridade máxima)
    const cycleIndex = currentStack.findIndex(
      (item) => item.type === targetType && item.id === targetId
    );

    if (cycleIndex !== -1) {
      const cycleChain = currentStack
        .slice(cycleIndex)
        .map((item) => `${item.type}:${item.id || item.title || 'unnamed'}`);
      cycleChain.push(`${targetType}:${targetId}`);

      return {
        hasCycle: true,
        maxDepthReached: false,
        cycleChain,
      };
    }

    // 2. Checagem de limite de profundidade
    if (currentStack.length >= MAX_COMPOSITE_DEPTH) {
      return {
        hasCycle: false,
        maxDepthReached: true,
        cycleChain: currentStack.map((item) => `${item.type}:${item.id}`),
      };
    }

    return {
      hasCycle: false,
      maxDepthReached: false,
      cycleChain: [],
    };
  };

  /**
   * Cria uma nova pilha de ancestrais incrementada para passar aos filhos
   */
  const createNextStack = (item: RenderContextItem): RenderContextItem[] => {
    return [...currentStack, item];
  };

  return {
    currentStack,
    checkCycle,
    createNextStack,
  };
}
