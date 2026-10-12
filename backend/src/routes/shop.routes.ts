import express from 'express';
import { getShopProfile, getPublicShopInfo, updateShopProfile } from '../controllers/shop.controller.js';

const router = express.Router();

router.get('/public', getPublicShopInfo);
router.get('/profile', getShopProfile);
router.put('/profile', updateShopProfile);

export default router;
