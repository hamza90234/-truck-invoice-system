import express from 'express';
import {
  getParts,
  createPart,
  getPartById,
  updatePart,
  deletePart
} from '../controllers/part.controller.js';

const router = express.Router();

router.get('/', getParts);
router.post('/', createPart);
router.get('/:id', getPartById);
router.put('/:id', updatePart);
router.delete('/:id', deletePart);

export default router;
