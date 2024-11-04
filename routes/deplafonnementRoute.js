import express from 'express';
import { requestDeplafonnement, validateDeplafonnement } from '../controllers/deplafonnementController.js';
import { getToken } from '../middlewares/authMiddleware.js';

import upload from "../utils/multer.js";

const deplafonnementRoute = express.Router();

//deplafonnementRoute.post('/create', getToken, requestDeplafonnement);

deplafonnementRoute.post('/create', upload.fields([{ name: 'photoPiece1', maxCount: 1 }, { name: 'photoPiece2', maxCount: 1 }]), getToken, requestDeplafonnement);

deplafonnementRoute.post('/validate/:requestId', getToken, validateDeplafonnement);

export default deplafonnementRoute;
