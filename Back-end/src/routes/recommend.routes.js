// routes/recommend.routes.js
import { Router } from "express";
import { recommendVendors } from "../controllers/recommend.controller.js";

const router = Router();

// Public — buyers can get recommendations without being logged in.
router.get("/vendors", recommendVendors);

export default router;
