import { Router } from 'express';
import { listarVendas, cadastrarVenda, buscarVendaPorId } from '../controllers/vendaController.js';
export const router = Router();
router.get('/', listarVendas);
router.post('/', cadastrarVenda);
router.get('/:id', buscarVendaPorId);
//# sourceMappingURL=vendaRoutes.js.map