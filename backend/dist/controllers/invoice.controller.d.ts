import type { Request, Response } from 'express';
export declare const getNextInvoiceNumber: (req: Request, res: Response) => Promise<void>;
export declare const getInvoices: (req: Request, res: Response) => Promise<void>;
export declare const getInvoiceById: (req: Request, res: Response) => Promise<void>;
export declare const getPublicInvoice: (req: Request, res: Response) => Promise<void>;
export declare const createInvoice: (req: Request, res: Response) => Promise<void>;
export declare const updateInvoice: (req: Request, res: Response) => Promise<void>;
export declare const deleteInvoice: (req: Request, res: Response) => Promise<void>;
export declare const recordPayment: (req: Request, res: Response) => Promise<void>;
export declare const closeInvoice: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=invoice.controller.d.ts.map