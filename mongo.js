import mongoose from "mongoose";
import dotenv from "dotenv";
import { Demo } from "./src/models/demo.model.js"; // adjust path if needed

dotenv.config();

// -------------------
// Connect to MongoDB
// -------------------
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// -------------------
// Helper: recursively add _id to all objects
// -------------------
const addMissingIdsRecursive = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(addMissingIdsRecursive);
  }

  if (!("_id" in obj) || obj._id == null) {
    obj._id = new mongoose.Types.ObjectId();
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === "object") {
      obj[key] = addMissingIdsRecursive(value);
    }
  }

  return obj;
};

// -------------------
// Main function
// -------------------
const fixAllIds = async () => {
  try {
    const products = await Demo.find().lean(); // get plain JS objects
    let updatedCount = 0;

    for (const product of products) {
      let modified = false;

      if (product.productModels && product.productModels.length > 0) {
        for (const model of product.productModels) {
          if (!model._id) {
            model._id = new mongoose.Types.ObjectId();
            modified = true;
          }

          if (model.productModelDetails) {
            const before = JSON.stringify(model.productModelDetails);

            model.productModelDetails = addMissingIdsRecursive(
              model.productModelDetails
            );

            const after = JSON.stringify(model.productModelDetails);
            if (before !== after) modified = true;
          }
        }
      }

      if (modified) {
        await Demo.updateOne(
          { _id: product._id },
          { $set: { productModels: product.productModels } }
        );
        updatedCount++;
        console.log(`Updated product ${product._id}`);
      }
    }

    console.log(`✅ Finished! Added missing _id fields to ${updatedCount} products`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating products:", err);
    process.exit(1);
  }
};

// -------------------
// Run
// -------------------
connectDB().then(fixAllIds);
