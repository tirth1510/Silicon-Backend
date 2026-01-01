import { Accessorize } from "../models/accessorize.model.js";

/* ---------------- CLEAN AND UPDATE productSpecifications ---------------- */
export const updateProductSpecificationsController = async (req, res) => {
  try {
    // Correct productSpecifications to apply to all products
    const correctProductSpecifications = [
      { key: "Color", value: "Black" },
    ];

    // Update all products
    const result = await Accessorize.updateMany(
      {}, // all products
      { $set: { productSpecifications: correctProductSpecifications } }
    );

    return res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} products with correct productSpecifications`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
