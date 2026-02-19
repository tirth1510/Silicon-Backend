import {
  createCategoryService,
  getAllCategoriesService,
  getCategoryByIdService,
  getCategoryBySlugService,
  updateCategoryService,
  deleteCategoryService,
  getProductsByCategoryService,
  updateCategoryProductCountService,
  updateAllCategoryCountsService,
} from "../services/category.service.js";
import { Readable } from "stream";

export const createCategory = async (req, res) => {
  try {
    const category = await createCategoryService(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === "true";

    const categories = await getAllCategoriesService(filters);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await getCategoryByIdService(categoryId);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await getCategoryBySlugService(slug);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

import { v2 as cloudinary } from "cloudinary";

// --- Cloudinary Config ---
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "categories" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

// --- Controller Function ---
export const updateCategory = async (req, res) => {
  try {
    // Handle both :id (PATCH) and :categoryId (PUT)
    const id = req.params.id || req.params.categoryId;
    let updateBody = { ...req.body };

    // Agar file upload hui hai, toh uska path 'categoryImage' field mein daal dein
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updateBody.categoryImage = result.secure_url;
    }

    // Aapka service function call
    const result = await updateCategoryService(id, updateBody);

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
// export const updateCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     const category = await updateCategoryService(categoryId, req.body);

//     res.status(200).json({
//       success: true,
//       message: "Category updated successfully",
//       data: category,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await deleteCategoryService(categoryId);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await getProductsByCategoryService(categoryId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCategoryProductCount = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const count = await updateCategoryProductCountService(categoryId);

    res.status(200).json({
      success: true,
      message: "Product count updated successfully",
      count,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAllCategoryCounts = async (req, res) => {
  try {
    const updates = await updateAllCategoryCountsService();

    res.status(200).json({
      success: true,
      message: "All category counts updated successfully",
      data: updates,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
