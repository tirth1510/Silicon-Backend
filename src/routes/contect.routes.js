import express from "express";
import {
  createContact,
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
router.get("/product-enq  uiries", getProductEnquiries);


export default router;
