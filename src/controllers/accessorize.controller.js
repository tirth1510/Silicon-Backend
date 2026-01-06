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





                    //// /-------------------------/  /// 


//Step-1


/**
 * Update product basic details
 * Fields: productCategory, productTitle, stock, description
 */
export const updateBasicDetailsController = async (req, res) => {
  try {
    const { id } = req.params;
    const { productCategory, productTitle, stock, description } = req.body;

    if (!productCategory || !productTitle || !description) {
      return res.status(400).json({
        success: false,
        message: "productCategory, productTitle, and description are required",
      });
    }

    const updatedProduct = await Accessorize.findByIdAndUpdate(
      id,
      {
        "basicDetails.productCategory": productCategory,
        "basicDetails.productTitle": productTitle,
        "basicDetails.stock": stock,
        "basicDetails.description": description,
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product basic details updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product basic details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


///    Step- 2 Price

// controllers/accessoryController.js

export const updatePriceController = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, discount, currency } = req.body;

    // Validate required fields
    if (price == null) {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    // Calculate finalPrice
    const discountAmount = (price * (discount || 0)) / 100;
    const finalPrice = price - discountAmount;

    // Update product
    const updatedProduct = await Accessorize.findByIdAndUpdate(
      id,
      {
        "priceDetails.price": price,
        "priceDetails.discount": discount || 0,
        "priceDetails.currency": currency || "INR",
        "priceDetails.finalPrice": finalPrice, // auto set
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product price updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product price:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};








export const deleteProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteProductService(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};