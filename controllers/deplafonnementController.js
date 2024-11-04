// deplafonController.js
import Deplafonnement from '../models/deplafonnement.js';
import Compte from '../models/compte.js';
import Utilisateur from '../models/utilisateur.js';
import Notification from '../models/notification.js';
import cloudinary from '../utils/cloudinary.js';

// Client requests deplafonnement
export const requestDeplafonnement = async (req, res) => {
    try{
        const { typePiece } = req.body;
        const userId = req.userId; 

        if(!userId){
            return res.status(401).json({ message: "Utilisateur non connecté" });
        }

        const user = await Utilisateur.findById(userId);
        if(!user){
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        if(user.deplafonner){
            return res.status(400).json({ message: "Votre compte a été déjà déplafonné" });
        }

        const deplafonnementEncours = await Deplafonnement.findOne({utilisateur: userId, status: 'ENCOURS'});

        if(deplafonnementEncours){
            return res.status(400).json({ message: "Vous avez deja fait une demande de déplafonnement en cours de traitement" });
        }

        const io = req.app.locals.io; // Récupère io depuis app.locals

        if(user.role !== 'CLIENT'){
            return res.status(403).json({ message: "Seul un client peut faire une demande de déplafonnement" });
        }

        if(!typePiece) {
            return res.status(400).json({ message: "Le type de pièce est obligatoire" });
        }

        let photoPiece1, photoPiece2;

        if (req.files) {
            if (req.files.photoPiece1) {
                const media = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { resource_type: 'auto' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(req.files.photoPiece1[0].buffer);  
                });
                photoPiece1 = (media).secure_url;
            }

            if (typePiece === 'CIN' && req.files.photoPiece2) {
                const media = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { resource_type: 'auto' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(req.files.photoPiece2[0].buffer);  
                });
                photoPiece2 = (media).secure_url;
            }
        }
    
        if(typePiece === 'PASSEPORT' && !photoPiece1){
            return res.status(400).json({ message: "La photo du passeport est obligatoire" });
        }

        if(typePiece === 'CIN' && (!photoPiece1 || !photoPiece2)){
            return res.status(400).json({ message: "La pièce d'identité doit avoir et la photo recto et la photo verso" });
        }

        const deplafonnement = new Deplafonnement({
            utilisateur: userId,
            photoPiece1,
            photoPiece2,
            typePiece,
        });

        await deplafonnement.save();

        const userAdminAndMarchand = await Utilisateur.find({ role: { $in: ['ADMIN', 'AGENT'] } });
        for(const destinataire of userAdminAndMarchand){
            const notification = await Notification.create({
                senderId: userId,
                receiverId: destinataire._id,
                message: `${user.nom} ${user.prenom} a fait une demande de déplafonnement`,
                type: "DEMANDE_DEPLAFONNMENT",
                idDemande: deplafonnement._id
            });

             // Envoyer la notification en temps réel si le destinataire est connecté
            const destinataireSocketId = io.userSockets.get(destinataire._id.toString());
            if(destinataireSocketId){
                const nbNotifications = await Notification.countDocuments({ 
                    receiverId: destinataire._id, 
                    read: false 
                });

                //emettre la notification via websocket
                io.to(destinataireSocketId).emit('nouvelleNotification', {
                    notification,
                    nbNotifications
                });
            }
        }

        res.status(201).json({ message: "Demande de déplafonnement envoyée avec succès", deplafonnement });
    }catch(error){
        console.log(error);
        return res.status(500).json({ message: "Erreur lors de la demande de déplafonnement", error: error.message });
    }
};

export const afficherDemandesDeplafonnement = async(req, res) => {
    try{
        //filter demandes by status encours and createdDate ascending
        const deplafonnements = await Deplafonnement.find({status: 'EN_COURS' }).populate('utilisateur', 'nom prenom photoProfile').sort({ dateCreation: 1 });
        res.status(200).json(deplafonnements);
    }catch(error){
        console.log(error);
        return res.status(500).json({ message: "Erreur lors de l'affichage des demandes de déplafonnement", error: error.message });
    }
}

// Admin validates deplafonnement
export const validerDeplafonnement = async (req, res) => {
    try {
        const { deplafonnementId } = req.params;

        // Vérifier si l'ID est fourni
        if (!deplafonnementId) {
            return res.status(400).json({ message: "Vous n'avez pas fourni l'ID du déplafonnement" });
        }

        // Rechercher le déplafonnement par son ID
        const deplafonnement = await Deplafonnement.findById(deplafonnementId).populate('utilisateur', '_id');
        if (!deplafonnement) {
            return res.status(404).json({ message: "Déplafonnement introuvable avec l'ID fourni" });
        }

        // Rechercher l'utilisateur associé
        const user = await Utilisateur.findById(deplafonnement.utilisateur._id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Vérifier si le compte est déjà déplafonné
        if (user.deplafonner) {
            return res.status(400).json({ message: "Ce compte a déjà été déplafonné" });
        }

        // Mettre à jour le statut de l'utilisateur pour "déplafonné"
        user.deplafonner = true;
        await user.save();

        // Rechercher et mettre à jour le compte associé
        const compte = await Compte.findOne({ utilisateur: deplafonnement.utilisateur._id });
        if (!compte) {
            return res.status(404).json({ message: "Compte non trouvé pour cet utilisateur" });
        }
        compte.soldeMaximum = 2000000;
        compte.cummulTransactionMensuelle = 10000000;
        await compte.save();

        // Mettre à jour le statut de la demande de déplafonnement
        deplafonnement.status = 'VALIDER';
        await deplafonnement.save();

        res.status(200).json({ message: "Demande de déplafonnement validée", deplafonnement });
    } catch (error) {
        console.error("Erreur serveur :", error);
        res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
};

