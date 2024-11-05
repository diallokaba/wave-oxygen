import express from "express";
import { faireDepot, faireRetrait, transfertEntreClient, getAllTransactionsOfConnectedUser, verifExistingPhoneNumber } from "../controllers/transfertClientController.js";
import { annulerTransaction } from "../controllers/transfertClientController.js";
import { getToken } from "../middlewares/authMiddleware.js";

const transactionClientRoute = express.Router();

transactionClientRoute.post("/transfert",getToken, transfertEntreClient);
transactionClientRoute.post("/depot",getToken, faireDepot);
transactionClientRoute.post("/retrait",getToken, faireRetrait);
transactionClientRoute.get("/transactions/all", getToken, getAllTransactionsOfConnectedUser);
transactionClientRoute.get("/verifier-numero/:phoneNumber", verifExistingPhoneNumber);
transactionClientRoute.post("/annuler-transaction",getToken, annulerTransaction);

export default transactionClientRoute;