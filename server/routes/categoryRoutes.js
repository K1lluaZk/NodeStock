import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';

const router = Router();

router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.delete('/:id', categoryController.delete);

export default router;