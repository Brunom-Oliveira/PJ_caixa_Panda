interface ProdutoInput {
    nome: string;
    codigos: string[];
    valor: number;
    estoque: number;
}
export declare const produtoService: {
    listar: () => Promise<({
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
    })[]>;
    cadastrar: (dados: ProdutoInput) => Promise<{
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
    }>;
    atualizar: (id: number, dados: Partial<ProdutoInput>) => Promise<{
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
    }>;
    excluir: (id: number) => Promise<{
        id: number;
        nome: string;
        valor: number;
        estoque: number;
        criadoEm: Date;
    }>;
    buscarPorCodigo: (codigo: string) => Promise<({
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
    }) | null>;
};
export {};
//# sourceMappingURL=produtoService.d.ts.map