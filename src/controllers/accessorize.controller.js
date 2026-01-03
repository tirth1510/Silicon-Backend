import {
  createProductService,
  createBulkProductService,
  getAllProductsService,
  getProductByIdService,
  getAllProductService,
  updateProductStatusService,
  deleteProductService,
  updateProductService
} from "../services/accessorize.service.js";

import {
  validateCreateProduct,
  validateBulkProduct,
} from "../validations/accessorize.validation.js";

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







export const updateProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await updateProductService(id, req.body, req.files);
    res.status(200).json({ success: true, message: "Product updated successfully", data: updatedProduct });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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