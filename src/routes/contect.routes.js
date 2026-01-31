import express from "express";
import {
  createContact,
  sendWhatsappMessage,
  getAllContacts,
  sendResponse,
  createProductEnquiry,
  getProductEnquiries,
} from "../controllers/contect.controller.js";
const router = express.Router();

router.post("/create", createContact);
router.get("/all", getAllContacts);
router.post("/send-response", sendResponse);

router.post("/product-enquiry", createProductEnquiry);
router.get("/product-enquiries", getProductEnquiries);

router.post("/send-whatsapp", sendWhatsappMessage);

export default router;
