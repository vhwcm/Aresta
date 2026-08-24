import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/error.middleware.js';
import { LoginInput } from '../schemas/auth.schema.js';

export class AuthService {
  async login(input: LoginInput) {
    const trimmedLogin = input.login.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: trimmedLogin }, { name: trimmedLogin }],
      },
    });

    if (!user) {
      throw new AppError('Usuário ou senha inválidos.', 401);
    }

    if (!user.is_active) {
      throw new AppError('Sua conta está inativa. Contate o administrador.', 403);
    }

    let passwordMatches = false;
    const passwordHash = user.password_hash || '';

    if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$')) {
      passwordMatches = await bcrypt.compare(input.password, passwordHash);
    } else {
      passwordMatches = input.password === passwordHash;
      if (passwordMatches) {
        // Atualiza para hash seguro
        const newHash = await bcrypt.hash(input.password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password_hash: newHash },
        });
      }
    }

    if (!passwordMatches) {
      throw new AppError('Usuário ou senha inválidos.', 401);
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
      },
    };
  }

  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
    };
  }
}

