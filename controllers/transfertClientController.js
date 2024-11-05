import Transaction from "../models/transaction.js";
import TypeTransaction from "../models/typeTransaction.js";
import Compte from '../models/compte.js';
import Utilisateur from '../models/utilisateur.js';
import DemandeAnnulation from '../models/demandeAnnulation.js';
import mongoose from 'mongoose';
import sendNotification from "../utils/sendNotification.js";




export const transfertEntreClient = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const userId = req.userId;
        const { receiverPhoneNumber, montant } = req.body;

        if (!Number.isInteger(montant) || montant <= 0) {
            throw new Error("Montant doit être un entier positif");
        }

        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non connecté' });
        }

        const user = await Utilisateur.findById(userId).session(session).select("_id role nom prenom");

        console.log(user);

        if(!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        if (user.role !== 'CLIENT') {
            return res.status(403).json({ message: 'Opération interdite : Seul les clients peuvent faire des transferts' });
        }

        const receiver = await Utilisateur.findOne({ telephone: receiverPhoneNumber }).session(session).select('_id role');
        
        if (!receiver) {
            return res.status(404).json({ message: 'Numéro du beneficiaire non trouvé' });
        }
        
        const senderAccount = await Compte.findOne({ utilisateur: userId }).session(session);
        if (!senderAccount) {
            return res.status(404).json({message: 'Le compte du l\'envoyeur n\'a pas été trouvé'});
        }

        const receiverAccount = await Compte.findOne({ utilisateur: receiver._id }).populate().session(session);
        if (!receiverAccount) {
            return res.status(404).json({message: 'Compte du destinataire non trouvé'});
        }

        const typeTransaction = await TypeTransaction.findOne({ nom: "TRANSFERT" }).session(session);

        if (!typeTransaction) {
            return res.status(404).json({message: "Type de transaction 'TRANSFERT' non trouvé"});
        }

        const montantTotal = montant + typeTransaction.frais;

        if (senderAccount.solde < montantTotal) {
            throw new Error("Votre solde est insuffisant");
        }        
    
        const transaction = new Transaction({
            receiver: receiverAccount._id,
            sender: senderAccount._id,
            montant: montant,
            etat: 'SUCCES',
            TypeTransaction: typeTransaction._id
        });

        senderAccount.solde -= montantTotal;
        receiverAccount.solde += montant;

        await transaction.save({ session });
        await senderAccount.save({ session });
        await receiverAccount.save({ session });

        const io = req.app.locals.io;

        sendNotification(user, receiver._id, 'vous a fait un transfert de ' + montant + ' ', "TRANSFERT", null, io);

        // Validation de la transaction
        await session.commitTransaction();

        return res.status(201).json({ message: "Transfert effectué avec succès", transaction, senderBalance: senderAccount.solde, receiverBalance: receiverAccount.solde});
        
    }
     catch (error) {
        await session.abortTransaction();
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
    finally {
        session.endSession();
    }
}

export const faireDepot = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const userId = req.userId;
        const { receiverPhoneNumber, montant } = req.body;

        if (!Number.isInteger(montant) || montant <= 0) {
            throw new Error("Montant doit être un entier positif");
        }

        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non connecté' });
        }

        const user = await Utilisateur.findById(userId).session(session).select("_id role nom prenom");

        console.log(user);

        if(!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        if (user.role !== 'AGENT') {
            return res.status(403).json({ message: 'Opération interdite : Seul les distributeurs peuvent faire des dépôts' });
        }

        const receiver = await Utilisateur.findOne({ telephone: receiverPhoneNumber }).session(session).select('_id role telephone');
        
        if (!receiver) {
            return res.status(404).json({ message: 'Numéro du beneficiaire non trouvé' });
        }
        
        const senderAccount = await Compte.findOne({ utilisateur: userId }).session(session);
        if (!senderAccount) {
            return res.status(404).json({message: 'Le compte de l\'envoyeur n\'a pas été trouvé'});
        }

        const receiverAccount = await Compte.findOne({ utilisateur: receiver._id }).populate().session(session);
        if (!receiverAccount) {
            return res.status(404).json({message: 'Compte du destinataire non trouvé'});
        }

        const typeTransaction = await TypeTransaction.findOne({ nom: "DEPOT" }).session(session);

        if (!typeTransaction) {
            return res.status(404).json({message: "Type de transaction 'DEPOT' non trouvé"});
        }

        console.log(typeTransaction);

        const montantTotal = montant + typeTransaction.frais;

        if (senderAccount.solde < montantTotal) {
            throw new Error("Votre solde est insuffisant");
        }        
    
        const transaction = new Transaction({
            receiver: receiverAccount._id,
            sender: senderAccount._id,
            montant: montant,
            etat: 'SUCCES',
            TypeTransaction: typeTransaction._id
        });

        senderAccount.solde -= montantTotal;
        receiverAccount.solde += montant;

        await transaction.save({ session });
        await senderAccount.save({ session });
        await receiverAccount.save({ session });

        const io = req.app.locals.io;

        sendNotification(user, receiver._id, 'vous a fait un dépot de ' + montant + ' ', "DEPOT", null, io);

        // Validation de la transaction
        await session.commitTransaction();

        return res.status(201).json({ message: "Dépôt effectué avec succès", transaction, senderBalance: senderAccount.solde, receiverBalance: receiverAccount.solde});
    }
     catch (error) {
        await session.abortTransaction();
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
    finally {
        session.endSession();
    }
}


export const faireRetrait = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const userId = req.userId;
        const { senderPhoneNumber, montant } = req.body;

        if (!Number.isInteger(montant) || montant <= 0) {
            throw new Error("Montant doit être un entier positif");
        }

        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non connecté' });
        }

        const user = await Utilisateur.findById(userId).session(session).select("_id role nom prenom");

        console.log(user);

        if(!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        if (user.role !== 'AGENT') {
            return res.status(403).json({ message: 'Opération interdite : Seul les distributeurs peuvent faire des dépôts' });
        }

        const sender = await Utilisateur.findOne({ telephone: senderPhoneNumber }).session(session).select('_id role');
        
        if (!sender) {
            return res.status(404).json({ message: 'Numéro du beneficiaire non trouvé' });
        }
        
        const senderAccount = await Compte.findOne({ utilisateur: sender._id }).session(session);
        if (!senderAccount) {
            return res.status(404).json({message: 'Le compte de l\'envoyeur n\'a pas été trouvé'});
        }

        const receiverAccount = await Compte.findOne({ utilisateur: userId }).populate().session(session);
        if (!receiverAccount) {
            return res.status(404).json({message: 'Compte du beneficiaire non trouvé'});
        }

        const typeTransaction = await TypeTransaction.findOne({ nom: "RETRAIT" }).session(session);
        if (!typeTransaction) {
            return res.status(404).json({message: "Type de transaction 'DEPOT' non trouvé"});
        }

        const montantTotal = montant + typeTransaction.frais;

        if (senderAccount.solde < montantTotal) {
            throw new Error("Votre solde est insuffisant");
        }        
    
        const transaction = new Transaction({
            receiver: receiverAccount._id,
            sender: senderAccount._id,
            montant: montant,
            etat: 'SUCCES',
            TypeTransaction: typeTransaction._id
        });

        senderAccount.solde -= montantTotal;
        receiverAccount.solde += montant;

        await transaction.save({ session });
        await senderAccount.save({ session });
        await receiverAccount.save({ session });

        const io = req.app.locals.io;

        sendNotification(user, sender._id, 'a fait un retrait de ' + montant + ' dans votre compte', "RETRAIT", null, io);

        // Validation de la transaction
        await session.commitTransaction();

        return res.status(201).json({ message: "Retrait effectué avec succès", transaction, senderBalance: senderAccount.solde, receiverBalance: receiverAccount.solde });
        
    }
     catch (error) {
        await session.abortTransaction();
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
    finally {
        session.endSession();
    }
}

export const verifExistingPhoneNumber = async(req, res) => {
    try {
        const phoneNumber = req.params.phoneNumber;
        const user = await Utilisateur.findOne({ telephone: phoneNumber });

        if (user) {
            return res.status(200).json({ message: 'Numéro existe déjà' });
        } 
            
        return res.status(404).json({ message: 'Ce numéro n\'existe pas dans notre système' });
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur lors de la vérification du numéro' });
    }
}

export const getAllTransactionsOfConnectedUser = async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Utilisateur non connecté' });
        }

        const user = await Utilisateur.findById(userId).select('_id');
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const compte = await Compte.findOne({ utilisateur: user._id });
        if (!compte) {
            return res.status(404).json({ message: 'Cet utilisateur n\'a pas de compte' });
        }
        
        console.log(compte);

        const transactions = await Transaction.find({
            $or: [
                { sender: compte._id },
                { receiver: compte._id }
            ]
        })
        .populate('TypeTransaction', 'nom frais')
        .sort({ date: -1 })
        .lean();

        return res.status(200).json({ transactions });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};


export const annulerTransaction = async (req, res) => {

    try {

        const userId = req.userId;
        const { idTrans } = req.body;
        const { motif } = req.body;
        
        const transaction = await Transaction.findById(idTrans);

        if (!transaction) {
            throw new Error("Transaction non trouvée");
        }

        const user = await Utilisateur.findById(userId);


        if (!user) {
            throw new Error("Accès non autorisé");
        }

        if(!user.role === 'CLIENT') {
            throw new Error("Seul le Client peut faire une demande d'annulation");
        }

        const demande = await DemandeAnnulation.findOne({
            transaction: transaction._id,
            etat: 'EN_ATTENTE'
        });

        if (demande) {
            throw new Error("Une demande d'annulation existe déjà pour cette transaction.");
        }
        const demandeAnnulation = new DemandeAnnulation({
            transaction: transaction._id,
            utilisateur: user._id,
            motif: motif,
            etat: 'EN_ATTENTE',
        }); 

        await demandeAnnulation.save();

        return res.status(200).json({
            message: "La demande d'annulation a été soumise à l'administrateur."
        });
            
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}


