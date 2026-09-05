import { prisma } from '../config/database'

export class GraphService {
  async getGraph(userId: number) {
    const annotations = await prisma.annotation.findMany({
      where: { user_id: userId },
      include: { annotationThemes: { include: { theme: true } }, flashcard: true },
    })

    const themes = await prisma.theme.findMany({
      include: {
        parentHierarchies: true,
        childHierarchies: true,
        annotationThemes: { where: { annotation: { user_id: userId } } },
      },
    })

    return { annotations, themes }
  }

  async getThemes() {
    return prisma.theme.findMany({ orderBy: { name: 'asc' } })
  }
}

export const graphService = new GraphService()
