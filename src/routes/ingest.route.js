import express from "express";
import { ingest } from "../controllers/ingest.controller.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
router.post("/",auth, ingest);

export default router;
