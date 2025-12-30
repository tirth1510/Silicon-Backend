import express from "express";
import multer from "multer";
import {
  createProductStep1,
  addProductModelDetails,
  addColorToModel,
  updateProductModelFeaturesController,
  addProductModelController,
  getAllProductsWithModelsController,
  getPaddingModelsController,
  updateProductController,
  updateModelController,
  updateModelDetailsController,
  updateColorDetailsController

} from "../controllers/demo.controller.js";
import {
  validateCreateProductStep1,
  validateProductModelFeatures,
  validateAddProductModel,
  validateUpdateProduct,
  
} from "../validations/product.validation.js";

const router = express.Router();

const storage = multer.memoryStorage();
export const upload = multer({ storage });

//      -- -- --   create oprrations -- -- --

router.post("/create/step-1", validateCreateProductStep1, createProductStep1);

router.put("/:productId/models/:modelId/details", addProductModelDetails);

router.post(
  "/products/:productId/models/:modelId/colors",
  upload.fields([
    { name: "colorImage", maxCount: 1 },
    { name: "productImages", maxCount: 10 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  addColorToModel
);

router.put(
  "/products/:productId/models/:modelId/features",
  validateProductModelFeatures,
  updateProductModelFeaturesController
);

router.post(
  "/products/:productId/models",
  validateAddProductModel,
  addProductModelController
);

// ----  ----  Read Opration

router.get("/products-with-models", getAllProductsWithModelsController);

router.get("/products/models/padding", getPaddingModelsController);

//   --- - ----  Update Api

router.put(
  "/products/:productId",
  validateUpdateProduct,
  updateProductController
);

router.put(
  "/products/update/:productId/models/:modelId",
  updateModelController
);

router.put(
  "/products/update/:productId/models/:modelId/details",
  updateModelDetailsController
);

router.put(
  "/products/:productId/models/:modelId/colors/:colorId/details",
  updateColorDetailsController
);

export default router;
