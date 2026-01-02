import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedCategories, updateProductCategories, updateCategoryCounts } from "./seedCategories.js";

// Load environment variables
dotenv.config();

const runSeed = async () => {
  try {
    console.log("🚀 Starting seed process...\n");
    
    // Check MongoDB URI
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGO_URI not found in .env file!");
      console.log("💡 Make sure your .env file contains:");
      console.log("   MONGO_URI=mongodb://localhost:27017/your-database-name\n");
      process.exit(1);
    }
    
    console.log(`🔌 Connecting to: ${mongoUri}\n`);
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB successfully!\n");
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}\n`);
    
    // Run seeding operations
    await seedCategories();
    await updateProductCategories();
    await updateCategoryCounts();
    
    console.log("\n🎉 All seeding operations completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Error during seeding:", error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("\n✨ Done! Connection closed.");
    process.exit(0);
  }
};

// Run the seed
runSeed();

