import express from "express";
import multer from "multer";
import { Demo } from "../models/demo.model.js";
import {
  updateColorBySection,
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
  getProductsByScheme,
  deleteModelController,
  updateValuableStatus,
  deleteValuableStatus,
  getValuableProducts,
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
router.get("/products-model-summary", async (req, res) => {
  try {
    const data = await Demo.aggregate([
      {
        $project: {
          productTitle: 1,
          models: "$productModels.modelName",
          totalModels: { $size: "$productModels" }
        }
      }
    ]);

    res.status(200).json({
      totalProducts: data.length,
      products: data
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});





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



router.patch(
  "/products/:productId/models/:modelId/sell",
  updateProductSellController
);


router.put(
  "/products/color/:productId/models/:modelId/colors/:colorId/:section",
   upload.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "productImages", maxCount: 1 },
  { name: "galleryImages", maxCount: 1 }
]),
  updateColorBySection
);

// PUT: http://localhost:5000/api/valuable/:productId/:modelId
router.put("/valuable/:productId/:modelId", updateValuableStatus);
// GET: http://localhost:5000/api/products/valuable
router.get("/valuable", getValuableProducts);
// DELETE: http://localhost:5000/api/valuable/:productId/:modelId
router.delete("/valuable/:productId/:modelId", deleteValuableStatus);
router.delete("/products/delete/:productId/models/:modelId", deleteModelController);

export default router;
