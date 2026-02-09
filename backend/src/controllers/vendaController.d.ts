import type { Request, Response } from 'express';
export declare const listarVendas: (req: Request, res: Response) => Promise<void>;
export declare const cadastrarVenda: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const buscarVendaPorId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=vendaController.d.ts.map