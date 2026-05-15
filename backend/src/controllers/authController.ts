
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/AppError.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      throw new AppError('Email e senha são obrigatórios.', 400);
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role },
      process.env.JWT_SECRET || 'panda_secret_default',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError('Não autenticado', 401);

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { id: true, nome: true, email: true, role: true }
    });

    res.json(usuario);
  } catch (err) {
    next(err);
  }
};
