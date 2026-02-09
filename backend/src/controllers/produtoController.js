import { produtoService } from '../services/produtoService.js';
export const listarProdutos = async (req, res) => {
    try {
        const produtos = await produtoService.listar();
        res.json(produtos);
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
export const cadastrarProduto = async (req, res) => {
    try {
        const novo = await produtoService.cadastrar(req.body);
        res.status(201).json(novo);
    }
    catch (err) {
        res.status(400).json({ erro: err.message });
    }
};
export const atualizarProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const atualizado = await produtoService.atualizar(Number(id), req.body);
        res.json(atualizado);
    }
    catch (err) {
        res.status(400).json({ erro: err.message });
    }
};
export const excluirProduto = async (req, res) => {
    try {
        const { id } = req.params;
        await produtoService.excluir(Number(id));
        res.json({ message: 'Produto removido com sucesso' });
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
export const buscarPorCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;
        if (!codigo)
            return res.status(400).json({ erro: 'Código não fornecido' });
        const produto = await produtoService.buscarPorCodigo(codigo);
        if (!produto)
            return res.status(404).json({ erro: 'Produto não encontrado' });
        res.json(produto);
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
//# sourceMappingURL=produtoController.js.map