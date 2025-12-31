import express from "express";
import { createContact } from "../controllers/contect.controller.js";
const router = express.Router();

router.post("/create", createContact);



export default router;
