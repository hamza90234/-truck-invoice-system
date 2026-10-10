import jwt from 'jsonwebtoken';
export const requireAuth = (req, res, next) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Unauthorized: No token provided' });
        return;
    }
    try {
        const decoded = jwt.verify(token, secret);
        // @ts-ignore
        req.shopId = decoded.shopId;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
//# sourceMappingURL=auth.middleware.js.map