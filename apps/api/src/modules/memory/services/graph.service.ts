export class GraphService {
  async getGraph(_userId: number) {
    return { nodes: [], edges: [] }
  }
}
export const graphService = new GraphService()
