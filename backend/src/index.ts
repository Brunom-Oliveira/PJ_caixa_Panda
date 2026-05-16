import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as produtoRoutes } from './routes/produtoRoutes.js';
import { router as vendaRoutes } from './routes/vendaRoutes.js';
import { router as configRoutes } from './routes/configRoutes.js';
import { router as clienteRoutes } from './routes/clienteRoutes.js';
import { estoqueRoutes } from './routes/estoqueRoutes.js';

import helmet from 'helmet';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/produtos', produtoRoutes);
app.use('/vendas', vendaRoutes);
app.use('/config', configRoutes);
app.use('/clientes', clienteRoutes);
app.use('/estoque', estoqueRoutes);

import { errorMiddleware } from './middleware/errorMiddleware.js';
// Middleware de erros deve ser o ultimo
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`✅ Servidor rodando em http://0.0.0.0:${PORT}`);
});
