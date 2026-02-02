import express from "express";
import { Demo } from "../models/demo.model.js";

const router = express.Router();

router.post("/product", async (req, res) => {
  try {
    const data = req.body;

    if (!data.productTitle || !data.productCategory || !data.description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 🧠 Fix null modelName
    if (Array.isArray(data.productModels)) {
      data.productModels = data.productModels.map((model, index) => ({
        ...model,
        modelName:
          model.modelName && model.modelName.trim()
            ? model.modelName
            : `MODEL-${index + 1}`,
      }));
    }

    // 🔍 Check same productTitle
    const existingProduct = await Demo.findOne({
      productTitle: data.productTitle,
    });

    if (existingProduct) {
      const existingModelNames = existingProduct.productModels.map(
        (m) => m.modelName
      );

      const newModels = data.productModels.filter(
        (m) => !existingModelNames.includes(m.modelName)
      );

      if (newModels.length) {
        existingProduct.productModels.push(...newModels);
        await existingProduct.save();
      }

      return res.status(200).json({
        success: true,
        message: "Models added to existing product",
      });
    }

    // 🆕 Create new product
    await Demo.create(data);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("PRODUCT API ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

export default router;
