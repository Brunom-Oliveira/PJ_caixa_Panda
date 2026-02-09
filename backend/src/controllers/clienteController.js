import { clienteService } from '../services/clienteService.js';
export const listarClientes = async (req, res) => {
    try {
        const clientes = await clienteService.listar();
        res.json(clientes);
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
export const cadastrarCliente = async (req, res) => {
    try {
        const novo = await clienteService.cadastrar(req.body);
        res.status(201).json(novo);
    }
    catch (err) {
        res.status(400).json({ erro: err.message });
    }
};
export const atualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const atualizado = await clienteService.atualizar(Number(id), req.body);
        res.json(atualizado);
    }
    catch (err) {
        res.status(400).json({ erro: err.message });
    }
};
export const excluirCliente = async (req, res) => {
    try {
        const { id } = req.params;
        await clienteService.excluir(Number(id));
        res.json({ mensagem: 'Cliente excluído com sucesso' });
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
//# sourceMappingURL=clienteController.js.map