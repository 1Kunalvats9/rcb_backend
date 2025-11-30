import express from "express";
import { ingest } from "../controllers/ingest.controller.js";

const router = express.Router();
router.post("/", ingest);

export default router;
