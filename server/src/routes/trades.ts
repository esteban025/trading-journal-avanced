import { Router } from 'express';
import { getTrades, getTradeById, createTrade, updateTrade, closeTrade, deleteTrade } from '../controllers/trades';

const router = Router();

router.get('/', getTrades);
router.get('/:id', getTradeById);
router.post('/', createTrade);
router.put('/:id', updateTrade);
router.put('/:id/close', closeTrade);
router.delete('/:id', deleteTrade);

export default router;
