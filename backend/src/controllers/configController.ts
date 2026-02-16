
import { prisma } from '../database/prisma.js';
import type { Request, Response, NextFunction } from 'express';

export const getConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let config = await prisma.configuracao.findFirst();
    if (!config) {
      config = await prisma.configuracao.create({
        data: { id: 1, nomeMercado: 'Panda Market', cnpj: '00.000.000/0001-00', endereco: '' }
      });
    }
    res.json(config);
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nomeMercado, cnpj, endereco } = req.body;
    const config = await prisma.configuracao.upsert({
      where: { id: 1 },
      update: { nomeMercado, cnpj, endereco },
      create: { id: 1, nomeMercado, cnpj, endereco }
    });
    res.json(config);
  } catch (err) {
    next(err);
  }
};
