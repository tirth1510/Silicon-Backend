import express from "express";
import multer from "multer";

import {
  createProductStep1,
  addProductModelDetails,
  addColorToModel,
  addProductModelController,
  getAllProductsWithModelsController,
  getPaddingModelsController,
  updateProductController,
  updateModelController,
  updateModelDetailsController,
  updateColorDetailsController,
  updateProductSellController,
  getProductSellController,
  getProductByModelIdController,
  updateColorBySection,
  getProductsByScheme,
  deleteModelController,
} from "../controllers/demo.controller.js";

import {
  validateCreateProductStep1,
  validateProductModelFeatures,
  validateAddProductModel,
  validateUpdateProduct,
} from "../validations/product.validation.js";

const router = express.Router();

/* ---------------- Multer ---------------- */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ---------------- CREATE ---------------- */

router.post(
  "/products",
  validateCreateProductStep1,
  createProductStep1
);

router.post(
  "/products/:productId/models",
  validateAddProductModel,
  addProductModelController
);

router.put(
  "/products/:productId/models/:modelId/details",
  addProductModelDetails
);

router.post(
  "/products/:productId/models/:modelId/colors",
  upload.fields([
    { name: "colorImage", maxCount: 1 },
    { name: "productImages", maxCount: 10 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  addColorToModel
);

/* ---------------- READ ---------------- */

router.get(
  "/products-with-models",
  getAllProductsWithModelsController
);

router.get(
  "/products/models/padding",
  getPaddingModelsController
);

router.get(
  "/limetedtimedeal/sell",
  getProductSellController
);

router.get(
  "/products/model/:modelId",
  getProductByModelIdController
);

router.get(
  "/products/scheme/:scheme",
  getProductsByScheme
);

/* ---------------- UPDATE ---------------- */

router.put(
  "/products/:productId",
  validateUpdateProduct,
  updateProductController
);

router.put(
  "/products/:productId/models/:modelId",
  updateModelController
);

router.put(
  "/products/:productId/models/:modelId/details/:section",
  updateModelDetailsController
);

router.put(
  "/products/:productId/models/:modelId/colors/:colorId",
  updateColorDetailsController
);

router.patch(
  "/products/:productId/models/:modelId/sell",
  updateProductSellController
);


router.put(
  "/products/:productId/models/:modelId/colors/:colorId/:section",
  upload.any(), // Accept any uploaded images (single or multiple)
  updateColorBySection
);


router.delete("/products/delete/:productId/models/:modelId", deleteModelController);

export default router;
