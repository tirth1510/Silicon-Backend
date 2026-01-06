
import {
  createProductStep1Service,
  addProductModelDetailsService,
  updateProductModelFeaturesService,
  addProductModelService,
  getAllModelsWithProductInfoService,
  getPaddingModelsService,
  updateProductService,
  updateModelService,
  updateModelDetailsService,
  updateColorDetailsService,
  getProductSellService,
  getProductByModelIdService,
  getProductsBySchemeService,
  updateProductSellService,
} from "../services/product.service.js";
import mongoose from "mongoose";

import { Demo } from "../models/demo.model.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

export const updateColorBySection = async (req, res) => {
  try {
    const { productId, modelId, colorId, section } = req.params;
    const { colorName, stock, price, discount, mainImage, productImages, galleryImages, index, deleteIndexes = [] } = req.body;

    const product = await Demo.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const model = product.productModels.find(m => m._id.toString() === modelId);
    if (!model) return res.status(404).json({ success: false, message: "Model not found" });

    const color = model.productModelDetails?.colors.find(c => c._id.toString() === colorId);
    if (!color) return res.status(404).json({ success: false, message: "Color not found" });

    // ---------------- CONDITION: DETAILS ----------------
    if (section === "details") {
      if (colorName !== undefined) color.colorName = colorName;
      if (stock !== undefined) color.stock = Number(stock);

      if (price !== undefined || discount !== undefined) {
        const existingPrice = color.colorPrice?.[0] || { price: 0, discount: 0, finalPrice: 0 };
        const newPrice = price !== undefined ? Number(price) : existingPrice.price;
        const newDiscount = discount !== undefined ? Number(discount) : existingPrice.discount;
        const finalPrice = newPrice - Math.round((newPrice * newDiscount) / 100);

        if (!color.colorPrice?.length) {
          color.colorPrice = [{ price: newPrice, discount: newDiscount, finalPrice }];
        } else {
          color.colorPrice[0].price = newPrice;
          color.colorPrice[0].discount = newDiscount;
          color.colorPrice[0].finalPrice = finalPrice;
        }
      }
    }

  // ---------------- CONDITION: IMAGES ----------------
if (section === "images") {
  // Main image
  if (req.files?.mainImage?.[0]) {
    const result = await uploadToCloudinary(req.files.mainImage[0].buffer);
    color.imageUrl = result.secure_url;
  }

  // Product images
  if (req.files?.productImages || req.body.deleteProductIndexes) {
    let images = [...(color.productImageUrl || [])];

    // Delete by index
    if (req.body.deleteProductIndexes) {
      const deleteIndexes = JSON.parse(req.body.deleteProductIndexes);
      deleteIndexes.sort((a, b) => b - a).forEach(i => {
        if (i >= 0 && i < images.length) images.splice(i, 1);
      });
    }

    // Replace at index
    if (req.body.index !== undefined && req.files?.productImages) {
      const uploaded = [];
      for (const file of req.files.productImages) {
        const result = await uploadToCloudinary(file.buffer);
        uploaded.push({ url: result.secure_url });
      }
      uploaded.forEach((img, i) => {
        images[Number(req.body.index) + i] = img;
      });
    }

    // Append new
    if (req.body.index === undefined && req.files?.productImages && !req.body.deleteProductIndexes) {
      for (const file of req.files.productImages) {
        const result = await uploadToCloudinary(file.buffer);
        images.push({ url: result.secure_url });
      }
    }

    color.productImageUrl = images;
  }

  // Gallery images
  if (req.files?.galleryImages || req.body.deleteGalleryIndexes) {
    let gallery = [...(color.productGallery || [])];

    // Delete by index
    if (req.body.deleteGalleryIndexes) {
      const deleteIndexes = JSON.parse(req.body.deleteGalleryIndexes);
      deleteIndexes.sort((a, b) => b - a).forEach(i => {
        if (i >= 0 && i < gallery.length) gallery.splice(i, 1);
      });
    }

    // Replace at index
    if (req.body.index !== undefined && req.files?.galleryImages) {
      const uploaded = [];
      for (const file of req.files.galleryImages) {
        const result = await uploadToCloudinary(file.buffer);
        uploaded.push({ url: result.secure_url });
      }
      uploaded.forEach((img, i) => {
        gallery[Number(req.body.index) + i] = img;
      });
    }

    // Append new
    if (req.body.index === undefined && req.files?.galleryImages && !req.body.deleteGalleryIndexes) {
      for (const file of req.files.galleryImages) {
        const result = await uploadToCloudinary(file.buffer);
        gallery.push({ url: result.secure_url });
      }
    }

    color.productGallery = gallery;
  }
}

    // ---------------- SAVE ----------------
    await product.save();
    res.json({ success: true, message: "Update applied successfully", color });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// --------------   create opration apis

//step-1
export const createProductStep1 = async (req, res) => {
  try {
    const product = await createProductStep1Service(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully (Step 1)",
      data: product,
    });
  } catch (error) {
    console.error("STEP-1 ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// step-2
export const addProductModelDetails = async (req, res) => {
  try {
    const { productId, modelId } = req.params;

    const model = await addProductModelDetailsService(
      productId,
      modelId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Model details added (Step-2)",
      data: model,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

//step-3
export const addColorToModel = async (req, res) => {
  try {
    const { productId, modelId } = req.params;
    const { colorName, stock, colorPrice } = req.body;

    if (!colorName)
      return res
        .status(400)
        .json({ success: false, message: "colorName is required" });
    if (!req.files || !req.files.colorImage) {
      return res
        .status(400)
        .json({ success: false, message: "colorImage is required" });
    }

    const product = await Demo.findById(productId);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    const model = product.productModels.id(modelId);
    if (!model)
      return res
        .status(404)
        .json({ success: false, message: "Model not found" });

    if (!model.productModelDetails) model.productModelDetails = { colors: [] };

    const mainResult = await uploadToCloudinary(req.files.colorImage[0].buffer);

    const productImages = [];
    if (req.files.productImages) {
      for (const file of req.files.productImages) {
        const result = await uploadToCloudinary(file.buffer);
        productImages.push({ url: result.secure_url });
      }
    }

    const galleryImages = [];
    if (req.files.galleryImages) {
      for (const file of req.files.galleryImages) {
        const result = await uploadToCloudinary(file.buffer);
        galleryImages.push({ url: result.secure_url });
      }
    }

    let parsedPrice = [];
    try {
      parsedPrice =
        typeof colorPrice === "string" ? JSON.parse(colorPrice) : colorPrice;
    } catch (e) {
      parsedPrice = [];
    }

    const colorObj = {
      colorName,
      imageUrl: mainResult.secure_url,
      productImageUrl: productImages,
      productGallery: galleryImages,
      colorPrice: parsedPrice,
      stock: stock ? parseInt(stock) : 0,
    };

    model.productModelDetails.colors.push(colorObj);
    await product.save();

    // यहाँ किसी cleanup (fs.unlink) की जरूरत नहीं है!
    return res.status(200).json({
      success: true,
      message: "Color added successfully",
      data: colorObj,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//step-4
export const updateProductModelFeaturesController = async (req, res) => {
  try {
    const { productId, modelId } = req.params;

    const updatedDetails = await updateProductModelFeaturesService(
      productId,
      modelId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Product model features updated successfully",
      data: updatedDetails,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// create model
export const addProductModelController = async (req, res) => {
  try {
    const { productId } = req.params;

    const newModel = await addProductModelService(productId, req.body);

    return res.status(201).json({
      success: true,
      message: "Product model added successfully",
      data: newModel,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ---- - --- -- Read Opration

export const getAllProductsWithModelsController = async (req, res) => {
  try {
    const data = await getAllModelsWithProductInfoService();

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPaddingModelsController = async (req, res) => {
  try {
    const data = await getPaddingModelsService();

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductSellController = async (req, res) => {
  try {
    const data = await getProductSellService();

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getProductByModelIdController = async (req, res) => {
  try {
    const { modelId } = req.params;

    if (!modelId) {
      return res
        .status(400)
        .json({ success: false, message: "Model ID is required" });
    }

    const productData = await getProductByModelIdService(modelId);

    if (!productData) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, data: productData });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// controllers/productController.js
export const getProductsByScheme = async (req, res) => {
  try {
    const { scheme } = req.params;

    const allowedSchemes = [
      "saleProduct",
      "tradingProduct",
      "companyProduct",
      "valuableProduct",
      "recommendedProduct",
      "all",
    ];

    if (!allowedSchemes.includes(scheme)) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheme type",
      });
    }

    let data = [];

    const ALL_SCHEMES = [
      "saleProduct",
      "tradingProduct",
      "companyProduct",
      "valuableProduct",
      "recommendedProduct",
    ];

    if (scheme === "all") {
      // fetch all schemes and merge
      const results = await Promise.all(
        ALL_SCHEMES.map((s) => getProductsBySchemeService(s))
      );

      const productMap = new Map();

      results.flat().forEach((product) => {
        if (!productMap.has(product.productId)) {
          const modelsWithAllSchemes = product.models.map((model) => ({
            ...model,
            productModelDetails: {
              ...model.productModelDetails,
              schem: ALL_SCHEMES.reduce((acc, key) => {
                acc[key] = !!model.productModelDetails.schem?.[key];
                return acc;
              }, {}),
            },
          }));

          productMap.set(product.productId, {
            ...product,
            models: modelsWithAllSchemes,
          });
        } else {
          const existing = productMap.get(product.productId);
          product.models.forEach((model) => {
            const exModel = existing.models.find(
              (m) => m.modelId === model.modelId
            );

            if (exModel) {
              exModel.productModelDetails.schem = ALL_SCHEMES.reduce(
                (acc, key) => {
                  acc[key] =
                    !!exModel.productModelDetails.schem[key] ||
                    !!model.productModelDetails.schem?.[key];
                  return acc;
                },
                {}
              );
            } else {
              existing.models.push({
                ...model,
                productModelDetails: {
                  ...model.productModelDetails,
                  schem: ALL_SCHEMES.reduce((acc, key) => {
                    acc[key] = !!model.productModelDetails.schem?.[key];
                    return acc;
                  }, {}),
                },
              });
            }
          });
        }
      });

      data = Array.from(productMap.values());
    } else {
      // specific scheme
      data = await getProductsBySchemeService(scheme);

      // ensure all models have all scheme keys
      data = data.map((product) => ({
        ...product,
        models: product.models.map((model) => ({
          ...model,
          productModelDetails: {
            ...model.productModelDetails,
            schem: ALL_SCHEMES.reduce((acc, key) => {
              acc[key] = !!model.productModelDetails.schem?.[key];
              return acc;
            }, {}),
          },
        })),
      }));
    }

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// -- --- ----  Update Oprations

export const updateProductController = async (req, res) => {
  try {
    const { productId } = req.params;
    const updatedData = await updateProductService(productId, req.body);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateModelController = async (req, res) => {
  try {
    const { productId, modelId } = req.params;
    const payload = req.body;

    const updatedModel = await updateModelService(productId, modelId, payload);

    return res.status(200).json({
      success: true,
      message: "Model updated successfully",
      data: updatedModel,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateModelDetailsController = async (req, res) => {
  try {
    const { productId, modelId, section } = req.params;

    const updatedModel = await updateModelDetailsService(
      productId,
      modelId,
      section,
      req.body
    );

    res.status(200).json({
      success: true,
      message: `${section} updated successfully`,
      data: updatedModel,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateColorDetailsController = async (req, res) => {
  try {
    const { productId, modelId, colorId } = req.params;
    const payload = req.body;

    const updatedColor = await updateColorDetailsService(
      productId,
      modelId,
      colorId,
      payload
    );

    return res.status(200).json({
      success: true,
      message: "Color details updated successfully",
      data: updatedColor,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};




export const updateProductSellController = async (req, res) => {
  try {
    const { productId, modelId } = req.params;
    const updateData = req.body; // expected: { saleProduct: true, tradingProduct: true, ... }

    const updatedSchem = await updateProductSellService(
      productId,
      modelId,
      updateData
    );

    return res.status(200).json({
      success: true,
      message: "Product sell flags updated successfully",
      data: updatedSchem,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const deleteModelController = async (req, res) => {
  try {
    const { productId, modelId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid productId" });
    }
    if (!mongoose.Types.ObjectId.isValid(modelId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid modelId" });
    }

    // Remove the model from the productModels array
    const updatedProduct = await Demo.findOneAndUpdate(
      { _id: productId },
      { $pull: { productModels: { _id: modelId } } },
      { new: true }
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({
      success: true,
      message: "Model deleted successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error deleting model:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
