import express from "express";
import {
  createContact,
  getAllContacts,
  sendResponse,
  createProductEnquiry,
  getProductEnquiries,
  createAccessorizeEnquiry,
  getAccessoryEnquiries,
} from "../controllers/contect.controller.js";
const router = express.Router();

router.post("/create", createContact);
router.get("/all", getAllContacts);
router.post("/send-response", sendResponse);

router.post("/product-enquiry", createProductEnquiry);
router.get("/product-enquiries", getProductEnquiries);

router.post("/accessory-enquiry", createAccessorizeEnquiry);
router.get("/accessory-enquiries", getAccessoryEnquiries);


export default router;
