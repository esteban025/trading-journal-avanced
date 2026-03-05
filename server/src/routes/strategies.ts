import { Router } from 'express';
import { getStrategies, getStrategyById, createStrategy, updateStrategy, deleteStrategy } from '../controllers/strategies';

const router = Router();

router.get('/', getStrategies);
router.get('/:id', getStrategyById);
router.post('/', createStrategy);
router.put('/:id', updateStrategy);
router.delete('/:id', deleteStrategy);

export default router;
