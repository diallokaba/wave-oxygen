import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
    message: {type: String, required: true},
    date: {type: Date, default: Date.now},
    read: {type: Boolean, default: false},
    type: String,
    idDemande: {type: String, required: true}
});

const Notification = mongoose.model('Notification', notificationSchema);    

export default Notification;