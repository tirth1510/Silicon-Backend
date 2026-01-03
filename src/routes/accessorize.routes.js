import express from "express";
import multer from "multer";
import {
  createProduct,
  getAllProducts,
  getAccessoryById,
  createBulkProducts,
  getPaddingProducts,
  updateProductStatusController,
  deleteProductController,
  updateProductController,
} from "../controllers/accessorize.controller.js";

const router = express.Router();

/**
 * ✅ MUST use memoryStorage
 * Required for Cloudinary buffer streaming
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
  },
});

router.post(
  "/create",
  upload.fields([
    { name: "productImages", maxCount: 5 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  createProduct
);
router.get("/all", getAllProducts);
router.get("/padding/all", getPaddingProducts);

router.post(
  "/create/bulk",
  upload.fields([
    { name: "productImages", maxCount: 5 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  createBulkProducts
);

router.get("/:id", getAccessoryById);

router.put("/:id/status",updateProductStatusController )


router.put("/:id", upload.fields([
  { name: "productImages" },
  { name: "galleryImages" },
]), updateProductController);



router.delete("/:id", deleteProductController);

export default router;
