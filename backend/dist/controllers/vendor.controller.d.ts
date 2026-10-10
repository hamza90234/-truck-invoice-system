import type { Request, Response } from 'express';
export declare const getVendors: (req: Request, res: Response) => Promise<void>;
export declare const getVendorById: (req: Request, res: Response) => Promise<void>;
export declare const createVendor: (req: Request, res: Response) => Promise<void>;
export declare const updateVendor: (req: Request, res: Response) => Promise<void>;
export declare const deleteVendor: (req: Request, res: Response) => Promise<void>;
export declare const createVendorPurchase: (req: Request, res: Response) => Promise<void>;
export declare const markPurchasePaid: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=vendor.controller.d.ts.map