import Notification from "../models/notification.js";

const sendNotification = async (sender, receiverId, message, type, idDemande, io) => {
    const notification = await Notification.create({
        senderId: sender._id,
        receiverId: receiverId,
        message: `${sender.nom} ${sender.prenom} ${message}`,
        type: type,
        idDemande: idDemande
    });

     // Envoyer la notification en temps réel si le destinataire est connecté
     const destinataireSocketId = io.userSockets.get(receiverId._id.toString());
     if(destinataireSocketId){
         const nbNotifications = await Notification.countDocuments({ 
             receiverId: receiverId, 
             read: false 
         });

         //emettre la notification via websocket
         io.to(destinataireSocketId).emit('nouvelleNotification', {
             notification,
             nbNotifications
         });
     }
}

export default sendNotification;