import { Router } from 'express';
import { 
    listarClientes, 
    cadastrarCliente, 
    atualizarCliente, 
    excluirCliente 
} from '../controllers/clienteController.js';

export const router = Router();

router.get('/', listarClientes);
router.post('/', cadastrarCliente);
router.put('/:id', atualizarCliente);
router.delete('/:id', excluirCliente);
