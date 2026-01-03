import mongoose from "mongoose";
import { Demo } from "../models/demo.model.js";

//  -- --- --
export const createProductStep1Service = async ({
  productCategory,
  productTitle,
  description,
  modelName,
}) => {
  const product = await Demo.create({
    productCategory,
    productTitle,
    description,
    productModels: [
      {
        modelName,
        status: "Padding",
        productModelDetails: null,
      },
    ],
  });

  return product;
};

export const addProductModelDetailsService = async (
  productId,
  modelId,
  modelDetails
) => {
  const product = await Demo.findById(productId);
  if (!product) throw new Error("Product not found");

  const model = product.productModels.id(modelId);
  if (!model) throw new Error("Model not found");

  model.productModelDetails = {
    specifications: modelDetails.specifications,
    productSpecifications: modelDetails.productSpecifications,
    productFeatures: modelDetails.productFeatures,
    warranty: modelDetails.warranty,
  };

  await product.save();
  return model;
};

export const updateProductModelFeaturesService = async (
  productId,
  modelId,
  featureData
) => {
  const product = await Demo.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const model = product.productModels.id(modelId);

  if (!model) {
    throw new Error("Model not found for this product");
  }

  // ✅ ensure optional object exists
  if (!model.productModelDetails) {
    model.productModelDetails = {};
  }

  const details = model.productModelDetails;

  if (featureData.productFeaturesIcons) {
    details.productFeaturesIcons = featureData.productFeaturesIcons;
  }

  if (featureData.standardParameters) {
    details.standardParameters = featureData.standardParameters;
  }

  if (featureData.optiomalParameters) {
    details.optiomalParameters = featureData.optiomalParameters;
  }

  await product.save();

  return details;
};

export const addProductModelService = async (productId, modelData) => {
  const product = await Demo.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const exists = product.productModels.some(
    (m) => m.modelName.toLowerCase() === modelData.modelName.toLowerCase()
  );

  if (exists) {
    throw new Error("Model with this name already exists");
  }

  const newModel = {
    modelName: modelData.modelName,
    status: modelData.status || "Padding",
    productModelDetails: null,
  };

  product.productModels.push(newModel);

  await product.save();

  return product.productModels[product.productModels.length - 1];
};

// -- -----    Read Opration

export const getAllModelsWithProductInfoService = async () => {
  const products = await Demo.find(
    {},
    {
      productTitle: 1,
      productCategory: 1,
      productModels: 1,
      description :1,
    }
  ).lean();

  const result = [];

  for (const product of products) {
    for (const model of product.productModels) {
      // Only include models with status "Live"
      if (model.status === "Live") {
        result.push({
          productId: product._id,
          productTitle: product.productTitle,
          productDescription: product.description, 
          productCategory: product.productCategory,
          modelId: model._id,
          modelName: model.modelName,
          status: model.status,
          productModelDetails: model.productModelDetails || null,
        });
      }
    }
  }

  return result;
};

export const getPaddingModelsService = async () => {
  const products = await Demo.find(
    {},
    {
      productTitle: 1,
      productCategory: 1,
      productModels: 1,
    }
  ).lean();

  const result = [];

  for (const product of products) {
    for (const model of product.productModels) {
      const allowedStatuses = ["Padding", "Enquiry"];

      if (allowedStatuses.includes(model.status)) {
        result.push({
          productId: product._id,
          productTitle: product.productTitle,
          productCategory: product.productCategory,
          modelId: model._id,
          modelName: model.modelName,
          status: model.status,
          productModelDetails: model.productModelDetails || null,
        });
      }
    }
  }

  return result;
};


export const getProductSellService = async () => {
  const products = await Demo.find(
    {},
    {
      productTitle: 1,
      productCategory: 1,
      productModels: 1,
    }
  ).lean();

  const result = [];

  for (const product of products) {
    for (const model of product.productModels) {
      // Only include models with status "Live"
      if (model.status === "Live" && model.productModelDetails.schem.saleProduct === true) {
        result.push({
          productId: product._id,
          productTitle: product.productTitle,
          productCategory: product.productCategory,
          modelId: model._id,
          modelName: model.modelName,
          status: model.status,
          productModelDetails: model.productModelDetails || null,
        });
      }
    }
  }

  return result;
};



export const getProductByModelIdService = async (modelId) => {
  const product = await Demo.findOne(
    { "productModels._id": modelId },
    { productTitle: 1, description: 1, productModels: 1 }
  ).lean();

  if (!product) return null;

  // Find the specific model details
  const model = product.productModels.find((m) => m._id.toString() === modelId);

  if (!model) return null;

  // Map all models of this product to only include modelId and modelName
  const allModels = product.productModels.map((m) => ({
    modelId: m._id,
    modelName: m.modelName,
  }));

  return {
    productId: product._id,
    productTitle: product.productTitle,
    description: product.description,
    modelId: model._id,
    modelName: model.modelName,
    status: model.status,
    productModelDetails: model.productModelDetails || null,
    allModels, // <<< new field: list of all models under this product
  };
};



export const getProductsBySchemeService = async (schemeKey) => {
  const products = await Demo.find(
    {},
    {
      productTitle: 1,
      productCategory: 1,
      description: 1,
      productModels: 1,
    }
  ).lean();

  const result = [];

  for (const product of products) {
    const matchedModels = [];

    for (const model of product.productModels || []) {
      const schem = model.productModelDetails?.schem;

      if (
        model.status === "Live" &&
        schem?.[schemeKey] === true
      ) {
        matchedModels.push({
          modelId: model._id,
          modelName: model.modelName,
          status: model.status,
          productModelDetails: model.productModelDetails ?? {},
        });
      }
    }

    // ⛔ DO NOT push empty products
    if (matchedModels.length > 0) {
      result.push({
        productId: product._id,
        productTitle: product.productTitle,
        productCategory: product.productCategory,
        description: product.description,
        models: matchedModels,
      });
    }
  }

  return result;
};



// --- -- -- -  update oprations

export const updateProductService = async (productId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid productId");
  }

  const updateData = {};

  if (payload.productCategory !== undefined)
    updateData.productCategory = payload.productCategory;
  if (payload.productTitle !== undefined)
    updateData.productTitle = payload.productTitle;
  if (payload.description !== undefined)
    updateData.description = payload.description;

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields provided for update");
  }

  const updatedProduct = await Demo.findByIdAndUpdate(
    productId,
    { $set: updateData },
    { new: true }
  );

  if (!updatedProduct) {
    throw new Error("Product not found");
  }

  return {
    _id: updatedProduct._id,
    productCategory: updatedProduct.productCategory,
    productTitle: updatedProduct.productTitle,
    description: updatedProduct.description,
  };
};

export const updateModelService = async (productId, modelId, payload) => {
  if (
    !mongoose.Types.ObjectId.isValid(productId) ||
    !mongoose.Types.ObjectId.isValid(modelId)
  ) {
    throw new Error("Invalid productId or modelId");
  }

  const updateFields = {};
  if (payload.modelName !== undefined)
    updateFields["productModels.$.modelName"] = payload.modelName;
  if (payload.status !== undefined)
    updateFields["productModels.$.status"] = payload.status;

  if (Object.keys(updateFields).length === 0) {
    throw new Error("No fields provided for update");
  }

  const updatedProduct = await Demo.findOneAndUpdate(
    { _id: productId, "productModels._id": modelId },
    { $set: updateFields },
    { new: true }
  );

  if (!updatedProduct) {
    throw new Error("Product or Model not found");
  }

  const updatedModel = updatedProduct.productModels.find(
    (m) => m._id.toString() === modelId
  );
  return updatedModel;
};


export const updateModelDetailsService = async (
  productId,
  modelId,
  section,
  data
) => {
  if (
    !mongoose.Types.ObjectId.isValid(productId) ||
    !mongoose.Types.ObjectId.isValid(modelId)
  ) {
    throw new Error("Invalid productId or modelId");
  }

  const allowedSections = [
    "specifications",
    "productSpecifications",
    "productFeatures",
    "warranty",
  ];

  if (!allowedSections.includes(section)) {
    throw new Error("Invalid section type");
  }

  if (!data || Object.keys(data).length === 0) {
    throw new Error("Update data is empty");
  }

  const updateQuery = {
    [`productModels.$.productModelDetails.${section}`]: data,
  };

  const updatedProduct = await Demo.findOneAndUpdate(
    { _id: productId, "productModels._id": modelId },
    { $set: updateQuery },
    { new: true }
  );

  if (!updatedProduct) {
    throw new Error("Product or Model not found");
  }

  return updatedProduct.productModels.find(
    (m) => m._id.toString() === modelId
  );
};



export const updateColorDetailsService = async (
  productId,
  modelId,
  colorId,
  payload
) => {
  if (
    !mongoose.Types.ObjectId.isValid(productId) ||
    !mongoose.Types.ObjectId.isValid(modelId) ||
    !mongoose.Types.ObjectId.isValid(colorId)
  ) {
    throw new Error("Invalid productId, modelId, or colorId");
  }

  const allowedFields = ["colorName", "stock", "colorPrice"];
  const updateData = {};

  for (const field of allowedFields) {
    if (payload.hasOwnProperty(field)) {
      updateData[
        `productModels.$.productModelDetails.colors.$[color].${field}`
      ] = payload[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields provided for update");
  }

  const updatedProduct = await Demo.findOneAndUpdate(
    { _id: productId, "productModels._id": modelId },
    { $set: updateData },
    {
      arrayFilters: [{ "color._id": colorId }],
      new: true,
    }
  );

  if (!updatedProduct) throw new Error("Product, Model, or Color not found");

  const updatedModel = updatedProduct.productModels.find(
    (m) => m._id.toString() === modelId
  );
  const updatedColor = updatedModel.productModelDetails.colors.find(
    (c) => c._id.toString() === colorId
  );

  return updatedColor;
};



export const updateProductSellService = async (productId, modelId, updateData) => {
  const product = await Demo.findById(productId);
  if (!product) throw new Error("Product not found");

  const model = product.productModels.id(modelId);
  if (!model) throw new Error("Model not found");

  // Initialize if missing
  if (!model.productModelDetails) model.productModelDetails = {};
  if (!model.productModelDetails.schem) model.productModelDetails.schem = {};

  // Merge updates
  model.productModelDetails.schem = {
    ...model.productModelDetails.schem.toObject(),
    ...updateData,
  };

  await product.save();
  return model.productModelDetails.schem;
};



/**
 * Get the product sell flags for a specific model
 * @param {string} productId
 * @param {string} modelId
 * @returns {object} schem object
 */

