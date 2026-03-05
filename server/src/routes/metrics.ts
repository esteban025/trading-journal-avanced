import { Router } from 'express';
import { getSummary, getEquityCurve, getByAsset, getByStrategy } from '../controllers/metrics';

const router = Router();

router.get('/summary', getSummary);
router.get('/equity-curve', getEquityCurve);
router.get('/by-asset', getByAsset);
router.get('/by-strategy', getByStrategy);

export default router;
