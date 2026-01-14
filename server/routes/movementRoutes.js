import express from 'express';
import { movementController } from '../controllers/movementController.js';

const router = express.Router();

router.post('/', movementController.registerMovement);
router.get('/:productId', movementController.getHistoryByProduct);

export default router;