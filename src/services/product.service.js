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
  payload
) => {
  if (
    !mongoose.Types.ObjectId.isValid(productId) ||
    !mongoose.Types.ObjectId.isValid(modelId)
  ) {
    throw new Error("Invalid productId or modelId");
  }

  // First, ensure productModelDetails is not null
  await Demo.updateOne(
    { _id: productId, "productModels._id": modelId },
    { $set: { "productModels.$.productModelDetails": {} } },
    { upsert: false }
  );

  const allowedFields = [
    "specifications",
    "productSpecifications",
    "productFeatures",
    "warranty",
  ];
  const updateData = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updateData[`productModels.$.productModelDetails.${field}`] =
        payload[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error("No valid fields provided for update");
  }

  const updatedProduct = await Demo.findOneAndUpdate(
    { _id: productId, "productModels._id": modelId },
    { $set: updateData },
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
