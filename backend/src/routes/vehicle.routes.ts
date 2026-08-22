import express from 'express';
import {
  createVehicle,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicle.controller.js';

const router = express.Router();

router.post('/', createVehicle);
router.get('/:id', getVehicleById);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
