import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
  getProductsByCategory,
  updateCategoryProductCount,
  updateAllCategoryCounts,
} from "../controllers/category.controller.js";

const router = express.Router();

// Create
router.post("/", createCategory);

// Read
router.get("/", getAllCategories);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:categoryId", getCategoryById);
router.get("/:categoryId/products", getProductsByCategory);

// Update
router.put("/:categoryId", updateCategory);
router.patch("/:categoryId/update-count", updateCategoryProductCount);
router.patch("/update-all-counts", updateAllCategoryCounts);

// Delete
router.delete("/:categoryId", deleteCategory);

export default router;

