import { Request } from 'express';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

