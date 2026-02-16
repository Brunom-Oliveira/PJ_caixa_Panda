
import { Router } from 'express';
// @ts-ignore
import { registrarMovimentacao, corrigirEstoque, listarHistorico } from '../controllers/estoqueController.js';

const router = Router();

router.post('/movimentacao', registrarMovimentacao);
router.post('/ajuste', corrigirEstoque);
router.get('/historico/:produtoId', listarHistorico);
router.get('/historico', listarHistorico); // Uses query or lists all

export { router as estoqueRoutes };
