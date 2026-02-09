import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { router as produtoRoutes } from './routes/produtoRoutes.js';
import { router as vendaRoutes } from './routes/vendaRoutes.js';
import { router as configRoutes } from './routes/configRoutes.js';
import { router as clienteRoutes } from './routes/clienteRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/produtos', produtoRoutes);
app.use('/vendas', vendaRoutes);
app.use('/config', configRoutes);
app.use('/clientes', clienteRoutes);

const PORT = process.env.PORT || 3000;
console.log('🔌 Database URL:', process.env.DATABASE_URL);
app.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));
