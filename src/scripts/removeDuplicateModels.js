import mongoose from "mongoose";
import dotenv from "dotenv";
import { Demo } from "../models/demo.model";

dotenv.config();

const removeDuplicateModels = async () => {
  try {
    console.log("🚀 Starting duplicate model removal process...");

    // Check DB Connection
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is missing in .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Fetch all products sorted by _id (creation time) ascending
    // This ensures we encounter the "oldest" models first.
    // Any duplicate found later (e.g., from Feb 2026) will be removed.
    const products = await Demo.find({}).sort({ _id: 1 });

    console.log(`📦 Scanning ${products.length} products for duplicates...`);

    // Map to store seen models: normalizedName -> { productId, productTitle }
    const seenModels = new Map();
    let removedCount = 0;
    let productsUpdated = 0;

    for (const product of products) {
      let isModified = false;
      const uniqueModels = [];

      if (!product.productModels || !Array.isArray(product.productModels)) {
        continue;
      }

      for (const model of product.productModels) {
        // Skip if modelName is missing
        if (!model.modelName) {
          uniqueModels.push(model);
          continue;
        }

        // Normalize: trim whitespace and lowercase for case-insensitive comparison
        const normalizedName = model.modelName.trim().toLowerCase();

        if (seenModels.has(normalizedName)) {
          // Duplicate found! (This implies it's newer than the one in seenModels)
          const original = seenModels.get(normalizedName);
          
          console.log(
            `🗑️  Removing duplicate model: "${model.modelName}"` +
            `\n    From Product: "${product.productTitle}"` +
            `\n    (Original kept in Product: "${original.productTitle}")`
          );
          
          isModified = true;
          removedCount++;
        } else {
          // First time seeing this model (Oldest), keep it
          seenModels.set(normalizedName, {
            productId: product._id,
            productTitle: product.productTitle
          });
          uniqueModels.push(model);
        }
      }

      // If we removed any models from this product, save the changes
      if (isModified) {
        product.productModels = uniqueModels;
        await product.save();
        productsUpdated++;
      }
    }

    console.log("\n===========================================");
    console.log(`✅ Duplicate Removal Completed`);
    console.log(`🔻 Total Duplicates Removed: ${removedCount}`);
    console.log(`📝 Products Updated: ${productsUpdated}`);
    console.log("===========================================\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Connection closed");
    process.exit(0);
  }
};

removeDuplicateModels();