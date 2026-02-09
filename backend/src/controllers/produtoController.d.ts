import type { Request, Response } from 'express';
export declare const listarProdutos: (req: Request, res: Response) => Promise<void>;
export declare const cadastrarProduto: (req: Request, res: Response) => Promise<void>;
export declare const atualizarProduto: (req: Request, res: Response) => Promise<void>;
export declare const excluirProduto: (req: Request, res: Response) => Promise<void>;
export declare const buscarPorCodigo: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=produtoController.d.ts.map