interface ClienteInput {
    nome: string;
    whatsapp?: string;
    email?: string;
}
export declare const clienteService: {
    listar: () => Promise<{
        id: number;
        nome: string;
        criadoEm: Date;
        whatsapp: string | null;
        email: string | null;
    }[]>;
    buscarPorId: (id: number) => Promise<{
        id: number;
        nome: string;
        criadoEm: Date;
        whatsapp: string | null;
        email: string | null;
    } | null>;
    cadastrar: (dados: ClienteInput) => Promise<{
        id: number;
        nome: string;
        criadoEm: Date;
        whatsapp: string | null;
        email: string | null;
    }>;
    atualizar: (id: number, dados: ClienteInput) => Promise<{
        id: number;
        nome: string;
        criadoEm: Date;
        whatsapp: string | null;
        email: string | null;
    }>;
    excluir: (id: number) => Promise<{
        id: number;
        nome: string;
        criadoEm: Date;
        whatsapp: string | null;
        email: string | null;
    }>;
};
export {};
//# sourceMappingURL=clienteService.d.ts.map