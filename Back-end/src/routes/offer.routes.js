// routes/offer.routes.js
import { Router } from "express";
import {
  createOffer,
  getOffersByConversation,
  withdrawOffer,
  acceptOffer,
  rejectOffer,
} from "../controllers/offer.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

// All offer routes require login
router.use(protect);

router.post  ("/",                           authorize("seller","admin","superadmin"),                    createOffer);
router.get   ("/conversation/:convId",       authorize("buyer","seller","admin","superadmin"),             getOffersByConversation);
router.patch ("/:id/withdraw",               authorize("seller","admin","superadmin"),                     withdrawOffer);
router.patch ("/:id/accept",                 authorize("buyer","admin","superadmin"),                      acceptOffer);
router.patch ("/:id/reject",                 authorize("buyer","admin","superadmin"),                      rejectOffer);

export default router;
