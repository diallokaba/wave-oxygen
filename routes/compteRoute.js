// routes/compteRoute.js

import express from 'express';
import { getCompteByConnectedUser, modifyStateAccount } from '../controllers/compteController.js';
import { getToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.patch('/:compteId/etat', getToken, modifyStateAccount);

router.get('/connected-user', getToken, getCompteByConnectedUser);

export default router;
