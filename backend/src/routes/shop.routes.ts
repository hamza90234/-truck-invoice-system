import express from 'express';
import { getShopProfile, updateShopProfile } from '../controllers/shop.controller.js';

const router = express.Router();

router.get('/profile', getShopProfile);
router.put('/profile', updateShopProfile);

export default router;
