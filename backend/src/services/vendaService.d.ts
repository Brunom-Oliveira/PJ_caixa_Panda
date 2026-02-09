export declare const vendaService: {
    cadastrar(itens: {
        produtoId: number;
        quantidade: number;
    }[], clienteId?: number): Promise<{
        cliente: {
            id: number;
            nome: string;
            criadoEm: Date;
            whatsapp: string | null;
            email: string | null;
        } | null;
        itens: ({
            produto: {
                id: number;
                nome: string;
                valor: number;
                estoque: number;
                criadoEm: Date;
            };
        } & {
            id: number;
            produtoId: number;
            quantidade: number;
            subtotal: number;
            vendaId: number;
        })[];
    } & {
        id: number;
        total: number;
        dataVenda: Date;
        clienteId: number | null;
    }>;
    listar(dataInicio?: string, dataFim?: string, produtoId?: number): Promise<({
        cliente: {
            id: number;
            nome: string;
            criadoEm: Date;
            whatsapp: string | null;
            email: string | null;
        } | null;
        itens: ({
            produto: {
                codigos: {
                    id: number;
                    codigo: string;
                    produtoId: number;
                }[];
            } & {
                id: number;
                nome: string;
                valor: number;
                estoque: number;
                criadoEm: Date;
            };
        } & {
            id: number;
            produtoId: number;
            quantidade: number;
            subtotal: number;
            vendaId: number;
        })[];
    } & {
        id: number;
        total: number;
        dataVenda: Date;
        clienteId: number | null;
    })[]>;
    buscarPorId(id: number): Promise<({
        cliente: {
            id: number;
            nome: string;
            criadoEm: Date;
            whatsapp: string | null;
            email: string | null;
        } | null;
        itens: ({
            produto: {
                id: number;
                nome: string;
                valor: number;
                estoque: number;
                criadoEm: Date;
            };
        } & {
            id: number;
            produtoId: number;
            quantidade: number;
            subtotal: number;
            vendaId: number;
        })[];
    } & {
        id: number;
        total: number;
        dataVenda: Date;
        clienteId: number | null;
    }) | null>;
};
//# sourceMappingURL=vendaService.d.ts.map