import Notification from "../models/notification.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non connecté' });
        }
        const notifications = await Notification.find({ 
            receiverId: userId, 
            read: false 
        }).populate('senderId');
    
        res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Erreur' });
    }
  };

export const getUnReadNotificationsCount = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non connecté' });
        }
        const count = await Notification.countDocuments({ receiverId: userId, read: false });

        res.status(200).json({ count });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

// Marquer une notification comme lue
export const markNotificationAsRead = async (req, res) => {
    try {
      const { notificationId } = req.params;
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Erreur' });
    }
  };