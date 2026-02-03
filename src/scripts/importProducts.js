import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Demo } from "../models/demo.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the JSON file
const JSON_PATH = path.join(__dirname, "../controllers/products.json");

const importProducts = async () => {
  try {
    // 1. Connect to Database
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // 2. Read and Parse JSON
    if (!fs.existsSync(JSON_PATH)) {
      throw new Error(`File not found at ${JSON_PATH}`);
    }
    
    const rawData = fs.readFileSync(JSON_PATH, "utf-8");
    // Fix invalid 'NaN' values in JSON before parsing
    const fixedData = rawData.replace(/NaN/g, "null"); 
    const productsList = JSON.parse(fixedData);

    console.log(`📂 Found ${productsList.length} records to process.`);

    // 3. Process each record
    for (const item of productsList) {
      const title = item.product_Title?.trim().toUpperCase();
      if (!title) continue;

      // Clean up category and map to code
      let rawCategory = item.Category_Products 
        ? item.Category_Products.replace(/["',]/g, "").trim() 
        : "";
      
      let category = "0"; // Default
      const lowerCat = rawCategory.toLowerCase();

      // Map based on keywords in the category name
      if (
        lowerCat.includes("operat") || 
        lowerCat.includes("theater") || 
        lowerCat.includes("theatre") || 
        lowerCat.includes("emergency") ||
        lowerCat.includes("emgergency") || // Typo in JSON
        lowerCat.includes("thearter")      // Typo in JSON
      ) {
        category = "1";
      } else if (
        lowerCat.includes("icu") || 
        lowerCat.includes("diagnostic") || 
        lowerCat.includes("therapeutic") ||
        lowerCat.includes("monitor") ||
        lowerCat.includes("cable")
      ) {
        category = "2";
      } else if (
        lowerCat.includes("nicu") || 
        lowerCat.includes("infant") || 
        lowerCat.includes("baby")
      ) {
        category = "3";
      }

      const modelName = item.Product_model_name ? String(item.Product_model_name).trim().toUpperCase() : "STANDARD";
      
      // Map Specifications (Array of Strings -> Array of Objects)
      const specs = (item.specifications || []).map(point => ({ points: point }));
      
      // Map Features (Parse into Key-Value pairs and Sort)
      const parsedFeatures = [];
      const rawFeatures = item.product_Factures || [];

      rawFeatures.forEach((rawText) => {
        if (!rawText) return;
        let text = String(rawText).trim();

        // Normalize delimiters:
        // 1. Replace bullets (•, â¢) with pipe |
        text = text.replace(/[•â¢]/g, "|");
        // 2. Replace newlines with pipe |
        text = text.replace(/\n/g, "|");
        // 3. Replace multiple spaces (2 or more) with pipe | (Common in the JSON provided)
        text = text.replace(/\s{2,}/g, "|");
        // 4. Replace ". " (Period + Space + Uppercase) with pipe | to handle paragraph style features
        text = text.replace(/\.\s+(?=[A-Z])/g, "|");

        let initialSegments = text.split("|");
        let segments = [];

        initialSegments.forEach((s) => {
          // Split by comma ONLY if followed by a potential key (text then colon)
          // This handles "Key: Value, Key: Value" without breaking "Key: Value, with comma"
          const parts = s.split(/,(?=\s*[^:]+:)/);
          segments.push(...parts);
        });

        segments.forEach((seg) => {
          let cleanSeg = seg.trim();
          if (!cleanSeg) return;

          // Remove leading special chars (bullets, dashes)
          cleanSeg = cleanSeg.replace(/^[-*•\s]+/, "");

          // Handle the specific mojibake "â" or " - " as separator by replacing with colon
          cleanSeg = cleanSeg.replace(/\s*(?:â| - )\s*/, ":");

          let key = "";
          let value = cleanSeg;

          const colonIndex = cleanSeg.indexOf(":");
          // Heuristic: Key must be reasonably short (< 60 chars) to be a valid key
          if (colonIndex > 0 && colonIndex < 60) {
            const pKey = cleanSeg.substring(0, colonIndex).trim();
            const pVal = cleanSeg.substring(colonIndex + 1).trim();
            if (pKey && pVal) {
              key = pKey;
              value = pVal;
            }
          }

          // If no explicit key found, generate one from the value (Short key based on value)
          if (!key) {
            const words = cleanSeg.split(/\s+/);
            // Take first 2 words to keep key name small/short
            let generatedKey = words.slice(0, 2).join(" ");
            // Remove punctuation but keep hyphens
            key = generatedKey.replace(/[^\w\s-]/g, "");
          }

          // Clean Key: Remove special chars, keep alphanumeric and spaces
          key = key.replace(/[^\w\s-]/g, "").trim();
          // Capitalize Key
          if (key) key = key.charAt(0).toUpperCase() + key.slice(1);
          if (!key) key = "Feature";

          parsedFeatures.push({ key, value });
        });
      });

      // Sort by Key
      parsedFeatures.sort((a, b) => a.key.localeCompare(b.key));

      // Map Warranty
      const warranty = item.warranty ? [{ points: String(item.warranty).trim() }] : [];

      // Map Price and Stock (Handling nulls)
      const price = item["Unnamed:_8"] ? Number(item["Unnamed:_8"]) : 0;
      const stock = item["Unnamed:_7"] ? Number(item["Unnamed:_7"]) : 100;

      // Construct Model Object
      const newModel = {
        modelName: modelName,
        status: "Live",
        productModelDetails: {
          specifications: specs,
          productFeatures: parsedFeatures,
          warranty: warranty,
          colors: [{
            colorName: "Standard",
            imageUrl: "https://placehold.co/400?text=No+Image", // Default placeholder
            stock: stock,
            colorPrice: [{ 
              currency: "INR",
              price: price, 
              discount: 0,
              finalPrice: price
            }]
          }],
          scheme: {
            saleProduct: false,
            tradingProduct: false,
            companyProduct: false,
            valuableProduct: false,
            recommendedProduct: false
          }
        }
      };

      // 4. Upsert Logic
      let product = await Demo.findOne({ productTitle: title });

      if (product) {
        // Check if model already exists to prevent duplicates
        const modelExists = product.productModels.some(
          (m) => m.modelName.toLowerCase() === modelName.toLowerCase()
        );

        if (!modelExists) {
          console.log(`   ➕ Adding model "${modelName}" to "${title}"`);
          product.productModels.push(newModel);
          await product.save();
        }
      } else {
        console.log(`   ✨ Creating new product: "${title}"`);
        await Demo.create({
          productCategory: category,
          productTitle: title,
          description: `${title} - ${category}`, // Fallback description
          productModels: [newModel]
        });
      }
    }

    console.log("✅ Import finished successfully.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error importing products:", error);
    process.exit(1);
  }
};

importProducts();