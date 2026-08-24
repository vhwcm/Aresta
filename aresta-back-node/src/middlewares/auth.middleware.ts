import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthenticatedRequest, JwtPayload } from '../types/index.js';
import { AppError } from './error.middleware.js';

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Acesso negado. Token não informado.', 401));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    return next();
  } catch (_error) {
    return next(new AppError('Token inválido ou expirado.', 401));
  }
};

export const optionalAuthenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = decoded;
      return next();
    } catch (_error) {
      // Ignora erro e continua com fallback de desenvolvimento
    }
  }

  // Fallback padrão para testes/desenvolvimento caso token não tenha sido enviado
  req.user = {
    userId: 1,
    email: 'viktor@aresta.org',
    role: 'ADMIN',
    name: 'viktor',
  };

  return next();
};

export const requireRole = (requiredRole: string) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Acesso negado. Não autenticado.', 401));
    }

    if (req.user.role?.toUpperCase() !== requiredRole.toUpperCase()) {
      return next(new AppError('Acesso negado. Permissão insuficiente.', 403));
    }

    return next();
  };
};

