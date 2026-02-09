import { prisma } from '../database/prisma.js';
export const getConfig = async (req, res) => {
    try {
        let config = await prisma.configuracao.findFirst();
        if (!config) {
            config = await prisma.configuracao.create({
                data: { id: 1, nomeMercado: 'Panda Market', cnpj: '00.000.000/0001-00' }
            });
        }
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
export const updateConfig = async (req, res) => {
    try {
        const { nomeMercado, cnpj } = req.body;
        const config = await prisma.configuracao.upsert({
            where: { id: 1 },
            update: { nomeMercado, cnpj },
            create: { id: 1, nomeMercado, cnpj }
        });
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ erro: err.message });
    }
};
//# sourceMappingURL=configController.js.map