import {
  createProductService,
  createBulkProductService,
  getAllProductsService,
  getProductByIdService,
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

    return res
  .status(200)
  .set("Content-Type", "application/json")
  .send(
    JSON.stringify(
      {
        success: true,
        count: products.length,
        products: products.map((p) => ({
          id: p._id,
          productCategory: p.productCategory,
          productTitle: p.productTitle,
          description: p.description,
          price: p.priceDetails?.price,
          discount: p.priceDetails?.discount,
          stock: p.stock,
          productImages: p.productImageUrl,
          galleryImages: p.productGallery,
          specifications: p.specifications,
          warranty: p.warranty,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      },
      null,
      2 // 👈 THIS forces new line per key
    )
  );

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
