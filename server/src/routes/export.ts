import { Router } from 'express';
import { exportCsv, exportExcel } from '../controllers/export';

const router = Router();

router.get('/csv', exportCsv);
router.get('/excel', exportExcel);

export default router;
