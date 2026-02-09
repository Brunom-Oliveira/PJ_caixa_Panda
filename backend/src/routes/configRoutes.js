import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/configController.js';
export const router = Router();
router.get('/', getConfig);
router.put('/', updateConfig);
//# sourceMappingURL=configRoutes.js.map