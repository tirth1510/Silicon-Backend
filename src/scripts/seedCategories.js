import mongoose from "mongoose";
import { Category } from "../models/category.model.js";
import { Demo } from "../models/demo.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the category mapping JSON
const categoryMappingPath = path.join(__dirname, "../data/categoryMapping.json");
const categoryData = JSON.parse(fs.readFileSync(categoryMappingPath, "utf-8"));

export const seedCategories = async () => {
  try {
    console.log("🌱 Starting category seeding...");

    // Clear existing categories (optional - remove if you want to keep existing)
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing categories. Clearing...`);
      await Category.deleteMany({});
    }

    // Insert new categories
    const categories = categoryData.categories;
    const result = await Category.insertMany(categories);
    console.log(`✅ Successfully seeded ${result.length} categories`);

    // Display category details
    result.forEach((cat) => {
      console.log(`   - ${cat.categoryId}: ${cat.categoryName}`);
    });

    return result;
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
    throw error;
  }
};

export const updateProductCategories = async () => {
  try {
    console.log("\n🔄 Starting product category updates...");

    const productMapping = categoryData.productMapping;
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const [productId, mapping] of Object.entries(productMapping)) {
      const product = await Demo.findById(productId);

      if (product) {
        product.productCategory = mapping.categoryId;
        await product.save();
        updatedCount++;
        console.log(`   ✓ Updated ${mapping.productTitle} → Category ${mapping.categoryId}`);
      } else {
        notFoundCount++;
        console.log(`   ✗ Product not found: ${productId} (${mapping.productTitle})`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} products`);
    if (notFoundCount > 0) {
      console.log(`⚠️  ${notFoundCount} products not found in database`);
    }

    return { updatedCount, notFoundCount };
  } catch (error) {
    console.error("❌ Error updating product categories:", error);
    throw error;
  }
};

export const updateCategoryCounts = async () => {
  try {
    console.log("\n📊 Updating category product counts...");

    const categories = await Category.find({});

    for (const category of categories) {
      const count = await Demo.countDocuments({
        productCategory: category.categoryId,
      });

      category.metadata.productCount = count;
      await category.save();

      console.log(`   - ${category.categoryName}: ${count} products`);
    }

    console.log("✅ Category counts updated successfully");
  } catch (error) {
    console.error("❌ Error updating category counts:", error);
    throw error;
  }
};

// Run all seeding operations
export const runFullSeed = async () => {
  try {
    await seedCategories();
    await updateProductCategories();
    await updateCategoryCounts();

    console.log("\n🎉 All seeding operations completed successfully!");
  } catch (error) {
    console.error("\n💥 Seeding failed:", error);
    throw error;
  }
};

// If running this file directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("📦 Connected to MongoDB");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      process.exit(1);
    }
  };

  connectDB()
    .then(() => runFullSeed())
    .then(() => {
      console.log("\n✨ Done! Closing connection...");
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      mongoose.connection.close();
      process.exit(1);
    });
}

