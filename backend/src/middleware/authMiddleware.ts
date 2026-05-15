import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';

interface UserPayload {
  id: number;
  role: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const authGuard = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Não autorizado. Token ausente.', 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'panda_secret_default') as UserPayload;
      
      // Role Based Access Control (RBAC)
      if (roles.length > 0 && !roles.includes(decoded.role)) {
         throw new AppError('Acesso Negado: Permissão insuficiente.', 403);
      }
      
      req.user = decoded;
      next();
    } catch (err) {
      throw new AppError('Sessão inválida ou expirada.', 401);
    }
  };
};
