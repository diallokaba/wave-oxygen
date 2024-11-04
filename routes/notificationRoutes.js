import express from 'express';
import { getToken } from '../middlewares/authMiddleware.js';
import { getNotifications, getUnReadNotificationsCount, markNotificationAsRead } from '../controllers/notificationController.js';


const notificationRoute = express.Router();

notificationRoute.get('/all', getToken, getNotifications);
notificationRoute.patch('/count', getToken, getUnReadNotificationsCount);
notificationRoute.patch('/:notificationId/read', markNotificationAsRead);

export default notificationRoute;