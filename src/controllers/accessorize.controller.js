import { Accessorize } from "../models/accessorize.model.js";
import cloudinary from "../config/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const {
      productCategory,
      productTitle,
      description,
      price,
      discount,
      stock,
      specifications,
      warranty,
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (
      !productCategory ||
      !productTitle ||
      !description ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    /* ---------- UPLOAD IMAGES ---------- */
    const productImageUrl = [];
    const productGallery = [];

    if (req.files?.productImages) {
      for (const file of req.files.productImages) {
        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "products/main-images",
        });
        productImageUrl.push({ url: upload.secure_url });
      }
    }

    if (req.files?.galleryImages) {
      for (const file of req.files.galleryImages) {
        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "products/gallery-images",
        });
        productGallery.push({ url: upload.secure_url });
      }
    }

    if (!productImageUrl.length) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    /* ---------- DUPLICATE CHECK ---------- */
    const existingProduct = await Accessorize.findOne({ productTitle });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product already exists",
      });
    }

    /* ---------- CREATE PRODUCT ---------- */
    const product = await Accessorize.create({
      productCategory,
      productTitle,
      description,
      priceDetails: {
        price: Number(price),
        discount: Number(discount) || 0,
      },
      stock: Number(stock) || 0,
      productImageUrl,
      productGallery,
      specifications: specifications
        ? specifications.split(",").map((s) => ({ points: s.trim() }))
        : [],
      warranty: warranty
        ? warranty.split(",").map((w) => ({ points: w.trim() }))
        : [],
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Accessorize.find({});

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
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
    const product = await Accessorize.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Accessory not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Invalid ID format",
    });
  }
};



export const createBulkProducts = async (req, res) => {
  try {
    const {
      productCategory,
      productTitles,
      description,
      price,
      discount,
      stock,
      specifications,
      warranty,
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (
      !productCategory ||
      !productTitles ||
      !description ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    /* ---------- SPLIT TITLES ---------- */
    const titlesArray = productTitles
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (!titlesArray.length) {
      return res.status(400).json({
        success: false,
        message: "At least one product title is required",
      });
    }

    /* ---------- UPLOAD IMAGES ONCE ---------- */
    const productImageUrl = [];
    const productGallery = [];

    if (req.files?.productImages) {
      for (const file of req.files.productImages) {
        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "products/main-images",
        });
        productImageUrl.push({ url: upload.secure_url });
      }
    }

    if (!productImageUrl.length) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    if (req.files?.galleryImages) {
      for (const file of req.files.galleryImages) {
        const upload = await cloudinary.uploader.upload(file.path, {
          folder: "products/gallery-images",
        });
        productGallery.push({ url: upload.secure_url });
      }
    }

    /* ---------- COMMON DATA ---------- */
    const specificationArr = specifications
      ? specifications.split(",").map((s) => ({ points: s.trim() }))
      : [];

    const warrantyArr = warranty
      ? warranty.split(",").map((w) => ({ points: w.trim() }))
      : [];

    /* ---------- PREPARE BULK DATA ---------- */
    const bulkProducts = titlesArray.map((title) => ({
      productCategory,
      productTitle: title,
      description,
      priceDetails: {
        price: Number(price),
        discount: Number(discount) || 0,
      },
      stock: Number(stock) || 0,
      productImageUrl,
      productGallery,
      specifications: specificationArr,
      warranty: warrantyArr,
    }));

    /* ---------- INSERT MANY ---------- */
    const createdProducts = await Accessorize.insertMany(bulkProducts);

    return res.status(201).json({
      success: true,
      message: "Bulk products created successfully",
      totalCreated: createdProducts.length,
      data: createdProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

