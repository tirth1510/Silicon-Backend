import mongoose from "mongoose";
import dotenv from "dotenv";
import { Demo } from "../models/demo.model.js";

dotenv.config();

const listProducts = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    
    console.log("📦 Connected to MongoDB\n");
    
    const products = await Demo.find({}).limit(50);
    
    console.log(`📋 Found ${products.length} products in database:\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.productTitle || 'Untitled'}`);
      console.log(`   ID: ${product._id}`);
      console.log(`   Category: ${product.productCategory || 'Not set'}`);
      console.log(`   Models: ${product.productModels?.length || 0}`);
      console.log();
    });
    
    if (products.length === 0) {
      console.log("⚠️  No products found in database!");
      console.log("💡 Create products first, then assign them to categories.\n");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

listProducts();

