import { Router } from 'express';
import { 
    listarProdutos, 
    cadastrarProduto, 
    buscarPorCodigo, 
    atualizarProduto, 
    excluirProduto 
} from '../controllers/produtoController.js';

export const router = Router();

router.get('/', listarProdutos);
router.post('/', cadastrarProduto);
router.put('/:id', atualizarProduto);
router.delete('/:id', excluirProduto);
router.get('/codigo/:codigo', buscarPorCodigo);
