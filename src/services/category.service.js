import { Category } from "../models/category.model.js";
import { Demo } from "../models/demo.model.js";

export const createCategoryService = async (categoryData) => {
  const category = new Category(categoryData);
  await category.save();
  return category;
};

export const getAllCategoriesService = async (filters = {}) => {
  const { isActive } = filters;
  
  const query = {};
  if (isActive !== undefined) query.isActive = isActive;

  const categories = await Category.find(query)
    .sort({ displayOrder: 1, categoryName: 1 })
    .lean();

  return categories;
};

export const getCategoryByIdService = async (categoryId) => {
  const category = await Category.findOne({ categoryId }).lean();
  
  if (!category) {
    throw new Error("Category not found");
  }
  
  return category;
};

export const getCategoryBySlugService = async (slug) => {
  const category = await Category.findOne({ 
    categorySlug: slug, 
    isActive: true 
  }).lean();
  
  if (!category) {
    throw new Error("Category not found");
  }
  
  return category;
};

export const updateCategoryService = async (categoryId, updateData) => {
  const category = await Category.findOneAndUpdate(
    { categoryId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

export const deleteCategoryService = async (categoryId) => {
  // Check if any products are using this category
  const productsCount = await Demo.countDocuments({ productCategory: categoryId });
  
  if (productsCount > 0) {
    throw new Error(`Cannot delete category. ${productsCount} products are using this category.`);
  }

  const category = await Category.findOneAndDelete({ categoryId });
  
  if (!category) {
    throw new Error("Category not found");
  }

  return category;
};

export const getProductsByCategoryService = async (categoryId) => {
  const category = await Category.findOne({ categoryId }).lean();
  
  if (!category) {
    throw new Error("Category not found");
  }

  const products = await Demo.find({ productCategory: categoryId })
    .select("productTitle description productModels productCategory")
    .lean();

  // Format response with model details
  const formattedProducts = [];
  
  for (const product of products) {
    for (const model of product.productModels) {
      if (model.status === "Live" && model.productModelDetails) {
        formattedProducts.push({
          productId: product._id,
          productTitle: product.productTitle,
          productCategory: product.productCategory,
          modelId: model._id,
          modelName: model.modelName,
          status: model.status,
          productModelDetails: model.productModelDetails,
        });
      }
    }
  }

  return {
    category,
    products: formattedProducts,
    count: formattedProducts.length,
  };
};

export const updateCategoryProductCountService = async (categoryId) => {
  const count = await Demo.countDocuments({ productCategory: categoryId });
  
  await Category.findOneAndUpdate(
    { categoryId },
    { "metadata.productCount": count }
  );

  return count;
};

// Bulk update all category counts
export const updateAllCategoryCountsService = async () => {
  const categories = await Category.find({});
  const updates = [];

  for (const category of categories) {
    const count = await Demo.countDocuments({ productCategory: category.categoryId });
    updates.push({
      categoryId: category.categoryId,
      count,
    });
    
    await Category.findOneAndUpdate(
      { categoryId: category.categoryId },
      { "metadata.productCount": count }
    );
  }

  return updates;
};

