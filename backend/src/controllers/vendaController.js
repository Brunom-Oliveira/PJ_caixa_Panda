import { vendaService } from '../services/vendaService.js';
export const listarVendas = async (req, res) => {
    try {
        const { dataInicio, dataFim, produtoId } = req.query;
        const vendas = await vendaService.listar(dataInicio, dataFim, produtoId ? Number(produtoId) : undefined);
        res.json(vendas);
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
export const cadastrarVenda = async (req, res) => {
    try {
        const { itens, clienteId } = req.body;
        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ erro: 'Itens da venda não fornecidos.' });
        }
        // Convert to proper types if needed
        const itensFormatados = itens.map((item) => ({
            produtoId: Number(item.produtoId),
            quantidade: Number(item.quantidade)
        }));
        const novaVenda = await vendaService.cadastrar(itensFormatados, clienteId ? Number(clienteId) : undefined);
        res.status(201).json(novaVenda);
    }
    catch (err) {
        res.status(400).json({ erro: err.message });
    }
};
export const buscarVendaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ erro: 'ID da venda não fornecido' });
        const venda = await vendaService.buscarPorId(Number(id));
        if (!venda)
            return res.status(404).json({ erro: 'Venda não encontrada' });
        res.json(venda);
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
//# sourceMappingURL=vendaController.js.map