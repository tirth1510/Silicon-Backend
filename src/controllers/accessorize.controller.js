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
  if (str === undefined) return [];
  try {
    const val = JSON.parse(str);
    if (!Array.isArray(val)) throw new Error(`${fieldName} must be an array`);
    return val;
  } catch (e) {
    const err = new Error(`Invalid JSON for ${fieldName}`);
    err.status = 400;
    throw err;
  }
}

// Helper: apply array operation (append / replace / delete)
function applyArrayOps(currentArray, incomingArray, replaceIndexes, deleteIndex) {
  const arr = Array.isArray(currentArray) ? [...currentArray] : [];

  if (deleteIndex !== undefined) {
    const di = Number(deleteIndex);
    if (!isNaN(di) && di >= 0 && di < arr.length) arr.splice(di, 1);
    return arr;
  }

  if (replaceIndexes !== undefined) {
    const idxs = Array.isArray(replaceIndexes)
      ? replaceIndexes.map(Number)
      : [Number(replaceIndexes)];
    idxs.forEach((idx, i) => {
      if (!isNaN(idx) && incomingArray[i] !== undefined) {
        arr[idx] = incomingArray[i];
      }
    });
    return arr;
  }

  // Append by default
  return [...arr, ...incomingArray];
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
        "priceDetails",
        "stock",
      ];
      for (const key of allowedSimpleUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
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
        const currentSpecs = productDoc.productSpecifications || [];

        updates.productSpecifications = applyArrayOps(
          currentSpecs,
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
        const currentSpecs = productDoc.specifications || [];

        updates.specifications = applyArrayOps(
          currentSpecs,
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
        const currentWarranty = productDoc.warranty || [];

        updates.warranty = applyArrayOps(
          currentWarranty,
          incomingWarranty,
          req.body.warrantyIndexes,
          req.body.deleteWarrantyIndex
        );
      }

      // ---------- productGallery (images) ----------
      // Delete without upload
      if (req.body.deleteGalleryIndex !== undefined) {
        const gallery = Array.isArray(productDoc.productGallery)
          ? [...productDoc.productGallery]
          : [];
        const idx = Number(req.body.deleteGalleryIndex);
        if (!isNaN(idx) && idx >= 0 && idx < gallery.length) {
          gallery.splice(idx, 1);
        }
        updates.productGallery = gallery;
      }

      // Replace without append conflict: one file + index
      if (req.files?.productGallery && req.body.replaceGalleryIndex !== undefined) {
        const uploaded = await Promise.all(
          req.files.productGallery.map((file) => uploadToCloudinary(file.buffer))
        );

        const gallery = Array.isArray(productDoc.productGallery)
          ? [...productDoc.productGallery]
          : [];
        const idx = Number(req.body.replaceGalleryIndex);
        if (!isNaN(idx) && idx >= 0 && idx < gallery.length && uploaded[0]) {
          gallery[idx] = { url: uploaded[0].secure_url };
        }
        updates.productGallery = gallery;
      } else if (req.files?.productGallery && req.body.replaceGalleryIndex === undefined) {
        // Append when no replace index provided
        const uploaded = await Promise.all(
          req.files.productGallery.map((file) => uploadToCloudinary(file.buffer))
        );
        const gallery = Array.isArray(productDoc.productGallery)
          ? productDoc.productGallery
          : [];
        updates.productGallery = [
          ...gallery,
          ...uploaded.map((img) => ({ url: img.secure_url })),
        ];
      }

      // ---------- productImageUrl (images) ----------
      // Delete without upload
      if (req.body.deleteImageIndex !== undefined) {
        const images = Array.isArray(productDoc.productImageUrl)
          ? [...productDoc.productImageUrl]
          : [];
        const idx = Number(req.body.deleteImageIndex);
        if (!isNaN(idx) && idx >= 0 && idx < images.length) {
          images.splice(idx, 1);
        }
        updates.productImageUrl = images;
      }

      // Replace with upload (single file recommended)
      if (req.files?.productImageUrl && req.body.replaceImageIndex !== undefined) {
        const uploaded = await Promise.all(
          req.files.productImageUrl.map((file) => uploadToCloudinary(file.buffer))
        );
        const images = Array.isArray(productDoc.productImageUrl)
          ? [...productDoc.productImageUrl]
          : [];
        const idx = Number(req.body.replaceImageIndex);
        if (!isNaN(idx) && idx >= 0 && idx < images.length && uploaded[0]) {
          images[idx] = { url: uploaded[0].secure_url };
        }
        updates.productImageUrl = images;
      } else if (req.files?.productImageUrl && req.body.replaceImageIndex === undefined) {
        // Overwrite field with new uploads (common behavior)
        const uploaded = await Promise.all(
          req.files.productImageUrl.map((file) => uploadToCloudinary(file.buffer))
        );
        updates.productImageUrl = uploaded.map((img) => ({ url: img.secure_url }));
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