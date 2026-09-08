import { prisma } from '../config/database'

export class UserService {
  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, is_active: true,
        current_streak: true, longest_streak: true, created_at: true,
        userSettings: true },
    })
  }

  async findAll() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, is_active: true, created_at: true },
    })
  }

  async updateProfile(id: number, data: { name?: string }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        current_streak: true,
        longest_streak: true,
        target_streak_days: true,
        created_at: true,
        userSettings: true,
      },
    })
  }
}

export const userService = new UserService()
