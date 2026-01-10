import {
  createProductService,
  createBulkProductService,
  getAllProductsService,
  getProductByIdService,
  getAllProductService,
  updateProductStatusService,
  deleteProductService,
} from "../services/accessorize.service.js";

import {
  validateCreateProduct,
  validateBulkProduct,
} from "../validations/accessorize.validation.js";
import {Accessorize} from "../models/accessorize.model.js"
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const error = validateCreateProduct(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const product = await createProductService(req.body, req.files);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const createBulkProducts = async (req, res) => {
  try {
    const error = validateBulkProduct(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const products = await createBulkProductService(req.body, req.files);

    res.status(201).json({
      success: true,
      message: "Bulk products created successfully",
      totalCreated: products.length,
      data: products,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await getAllProductsService();

    const mappedProducts = products.map((p) => {
      const price = p.priceDetails?.price ?? 0;
      const discount = p.priceDetails?.discount ?? 0;
      const finalPrice = Math.round(price - (price * discount) / 100);

      return {
        id: p._id,
        productCategory: p.productCategory,
        productTitle: p.productTitle,
        description: p.description,
        status: p.status,
        price,                // original price
        discount,             // discount %
        finalPrice,           // computed final price
        stock: p.stock,
        productImages: p.productImageUrl,
        galleryImages: p.productGallery,
        specifications: p.specifications,
        productSpecifications : p.productSpecifications,
        warranty: p.warranty,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products: mappedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getPaddingProducts = async (req, res) => {
  try {
    const products = await getAllProductService();

    const mappedProducts = products.map((p) => {
      const price = p.priceDetails?.price ?? 0;
      const discount = p.priceDetails?.discount ?? 0;
      const finalPrice = Math.round(price - (price * discount) / 100);

      return {
        id: p._id,
        productCategory: p.productCategory,
        productTitle: p.productTitle,
        description: p.description,
        status: p.status,
        price,                // original price
        discount,             // discount %
        finalPrice,           // computed final price
        stock: p.stock,
        productImages: p.productImageUrl,
        galleryImages: p.productGallery,
        specifications: p.specifications,
        productSpecifications : p.productSpecifications,
        warranty: p.warranty,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      count: products.length,
      products: mappedProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAccessoryById = async (req, res) => {
  try {
    const product = await getProductByIdService(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Accessory not found",
      });
    }

    res.status(200).json({ success: true, data: product });
  } catch {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }
};




export const updateProductStatusController = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const product = await updateProductStatusService(id, status);
    res.json({ success: true, message: "Status updated successfully", product });
  } catch (error) {
    console.error(error);
    if (error.message === "Invalid status value") {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message === "Product not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


/* ================= UPDATE PRODUCT ================= */
// PUT /api/accessorize/:id


// helper: upload buffer to Cloudinary



const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "uploads" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

function parseJsonArray(str, fieldName) {
  if (!str) return [];
  try {
    const val = JSON.parse(str);
    if (!Array.isArray(val)) throw new Error(`${fieldName} must be an array`);
    return val;
  } catch (e) {
    if (Array.isArray(str)) return str;
    const err = new Error(`Invalid JSON for ${fieldName}`);
    err.status = 400;
    throw err;
  }
}

// Helper: apply array operation (Delete -> Replace -> Append)
function applyArrayOps(currentArray, incomingArray, replaceIndexes, deleteIndex) {
  // 1. Create a copy of the current array
  let arr = Array.isArray(currentArray) ? [...currentArray] : [];

  // 2. Handle Deletions
  // We use a Set to track indices to remove to avoid index shifting issues during the process
  const indicesToDelete = new Set();
  if (deleteIndex !== undefined && deleteIndex !== null && deleteIndex !== "") {
    let idxs = [];
    try {
      idxs = JSON.parse(deleteIndex);
    } catch {
      idxs = [deleteIndex];
    }
    if (!Array.isArray(idxs)) idxs = [idxs];
    
    idxs.forEach(i => {
      const n = Number(i);
      if (!isNaN(n) && n >= 0 && n < arr.length) {
        indicesToDelete.add(n);
      }
    });
  }

  // 3. Handle Replacements
  // We apply replacements to the original positions (unless they are marked for deletion)
  if (replaceIndexes !== undefined && replaceIndexes !== null && replaceIndexes !== "" && incomingArray && incomingArray.length > 0) {
    let idxs = [];
    try {
      idxs = JSON.parse(replaceIndexes);
    } catch {
      idxs = [replaceIndexes];
    }
    if (!Array.isArray(idxs)) idxs = [idxs];

    idxs.forEach((idx, i) => {
      const n = Number(idx);
      // Only replace if valid index and we have data for it
      if (!isNaN(n) && n >= 0 && n < arr.length && incomingArray[i] !== undefined) {
        // If the index is not marked for deletion, update it
        if (!indicesToDelete.has(n)) {
          arr[n] = incomingArray[i];
        }
      }
    });
  }

  // 4. Filter out deleted items
  // We do this after replacement to ensure replacement indices matched the original array structure
  arr = arr.filter((_, index) => !indicesToDelete.has(index));

  // 5. Handle Append
  // If NO replace indexes were provided, we assume all incoming data is new and should be appended.
  // If replace indexes WERE provided, we assume incoming data was meant for those replacements.
  if ((replaceIndexes === undefined || replaceIndexes === null || replaceIndexes === "") && incomingArray && incomingArray.length > 0) {
    arr.push(...incomingArray);
  }

  return arr;
}


export const updateAccssoriesDetails = async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch product once
      const productDoc = await Accessorize.findById(id);
      if (!productDoc) {
        return res.status(404).json({ message: "Product not found" });
      }

      const updates = {};

      // Only allow non-array simple fields in generic loop
      const allowedSimpleUpdates = [
        "productCategory",
        "productTitle",
        "description",
        "status",
        "stock",
      ];
      for (const key of allowedSimpleUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      // Handle priceDetails (parse if string)
      if (req.body.priceDetails !== undefined) {
        try {
          updates.priceDetails = typeof req.body.priceDetails === 'string' 
            ? JSON.parse(req.body.priceDetails) 
            : req.body.priceDetails;
        } catch (e) {
          return res.status(400).json({ message: "Invalid JSON for priceDetails" });
        }
      }

      // ---------- productSpecifications ----------
      if (
        req.body.productSpecifications !== undefined ||
        req.body.specIndexes !== undefined ||
        req.body.deleteIndex !== undefined
      ) {
        const incomingSpecs = parseJsonArray(
          req.body.productSpecifications,
          "productSpecifications"
        );
        
        updates.productSpecifications = applyArrayOps(
          productDoc.productSpecifications,
          incomingSpecs,
          req.body.specIndexes,
          req.body.deleteIndex
        );
      }

      // ---------- specifications ----------
      if (
        req.body.specifications !== undefined ||
        req.body.specificationIndexes !== undefined ||
        req.body.deleteSpecificationIndex !== undefined
      ) {
        const incomingSpecs = parseJsonArray(
          req.body.specifications,
          "specifications"
        );
        
        updates.specifications = applyArrayOps(
          productDoc.specifications,
          incomingSpecs,
          req.body.specificationIndexes,
          req.body.deleteSpecificationIndex
        );
      }

      // ---------- warranty ----------
      if (
        req.body.warranty !== undefined ||
        req.body.warrantyIndexes !== undefined ||
        req.body.deleteWarrantyIndex !== undefined
      ) {
        const incomingWarranty = parseJsonArray(
          req.body.warranty,
          "warranty"
        );
        
        updates.warranty = applyArrayOps(
          productDoc.warranty,
          incomingWarranty,
          req.body.warrantyIndexes,
          req.body.deleteWarrantyIndex
        );
      }

      // ---------- productGallery (images) ----------
      let galleryIncoming = [];
      if (req.files?.productGallery) {
        const uploaded = await Promise.all(
          req.files.productGallery.map((file) => uploadToCloudinary(file.buffer))
        );
        galleryIncoming = uploaded.map(res => ({ url: res.secure_url }));
      }

      if (galleryIncoming.length > 0 || req.body.deleteGalleryIndex !== undefined) {
        updates.productGallery = applyArrayOps(
          productDoc.productGallery,
          galleryIncoming,
          req.body.replaceGalleryIndex,
          req.body.deleteGalleryIndex
        );
      }

      // ---------- productImageUrl (images) ----------
      let imageIncoming = [];
      if (req.files?.productImageUrl) {
        const uploaded = await Promise.all(
          req.files.productImageUrl.map((file) => uploadToCloudinary(file.buffer))
        );
        imageIncoming = uploaded.map(res => ({ url: res.secure_url }));
      }

      if (imageIncoming.length > 0 || req.body.deleteImageIndex !== undefined) {
        updates.productImageUrl = applyArrayOps(
          productDoc.productImageUrl,
          imageIncoming,
          req.body.replaceImageIndex,
          req.body.deleteImageIndex
        );
      }

      // ---------- persist ----------
      const product = await Accessorize.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product updated successfully", product });
    } catch (error) {
      console.error("Update error:", error);
      const status = error.status ?? 500;
      res.status(status).json({ message: error.message || "Server error" });
    }
  }





export const deleteProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteProductService(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};