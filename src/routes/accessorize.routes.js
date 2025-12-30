import express from "express";
import multer from "multer";
import { createProduct , getAllProducts , getAccessoryById, createBulkProducts} from "../controllers/accessorize.controller.js";

const router = express.Router();

const storage = multer.diskStorage({});
const upload = multer({ storage });


router.post(
  "/create",
  upload.fields([
    { name: "productImages", maxCount: 5 },
    { name: "galleryImages", maxCount: 10 }
  ]),
  createProduct
);
router.post(
  "/create/bulk",
  upload.fields([
    { name: "productImages", maxCount: 5 },
    { name: "galleryImages", maxCount: 10 }
  ]),
  createBulkProducts
);

router.get("/all", getAllProducts);
router.get("/:id", getAccessoryById);
export default router