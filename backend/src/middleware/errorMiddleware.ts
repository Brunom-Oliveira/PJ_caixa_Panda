import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { Prisma } from '@prisma/client';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint failed
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') || 'campo';
      return res.status(409).json({
        status: 'error',
        message: `Já existe um registro com este ${field}.`,
      });
    }
    // Record not found
    if (err.code === 'P2025') {
       return res.status(404).json({
        status: 'error',
        message: 'Registro não encontrado para a operação solicitada.',
      });
    }
  }

  console.error('❌ Erro Interno:', err);

  return res.status(500).json({
    status: 'error',
    message: 'Ocorreu um erro interno no servidor.',
  });
}
