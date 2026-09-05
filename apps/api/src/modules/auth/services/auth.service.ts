import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import type { RegisterDto, LoginDto } from '../schemas/auth.schema'

export class AuthService {
  async register(data: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new Error('Email already registered')

    const password_hash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password_hash, userSettings: { create: {} } },
      select: { id: true, name: true, email: true, role: true, is_active: true },
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'sua-chave-jwt-secreta-compartilhada',
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
    )

    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.is_active } }
  }

  async login(data: LoginDto) {
    const identifier = (data.email || data.login || '').trim()
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { name: identifier }
        ]
      }
    })
    if (!user || !user.password_hash) throw new Error('Invalid credentials')

    const valid = await bcrypt.compare(data.password, user.password_hash)
    if (!valid) throw new Error('Invalid credentials')

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'sua-chave-jwt-secreta-compartilhada',
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any }
    )
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.is_active } }
  }
}

export const authService = new AuthService()
