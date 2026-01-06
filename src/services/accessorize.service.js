import { Accessorize } from "../models/accessorize.model.js";
import { uploadImages } from "../utils/uploadToCloudinary.js";

export const createProductService = async (data, files) => {
  const {
    productCategory,
    productTitle,
    description,
    price,
    productSpecifications,
    discount,
    stock,
    specifications,
    warranty,
  } = data;

  const existing = await Accessorize.findOne({ productTitle });
  if (existing) throw new Error("Product already exists");

  if (!files?.productImages) {
    throw new Error("At least one product image is required");
  }

  const productImageUrl = await uploadImages(
    files.productImages,
    "products/main-images"
  );

  const productGallery = files?.galleryImages
    ? await uploadImages(files.galleryImages, "products/gallery-images")
    : [];

  const parsedProductSpecifications = productSpecifications
    ? JSON.parse(productSpecifications) // [{ key, value }]
    : [];
  return Accessorize.create({
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
    productSpecifications: parsedProductSpecifications,
  });
};

export const createBulkProductService = async (data, files) => {
  const {
    productCategory,
    productTitles,
    description,
    price,
    discount,
    stock,
    specifications,
    warranty,
  } = data;

  const titles = productTitles
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!titles.length) throw new Error("At least one product title is required");

  if (!files?.productImages) {
    throw new Error("At least one product image is required");
  }

  const productImageUrl = await uploadImages(
    files.productImages,
    "products/main-images"
  );

  const productGallery = files?.galleryImages
    ? await uploadImages(files.galleryImages, "products/gallery-images")
    : [];

  const specArr = specifications
    ? specifications.split(",").map((s) => ({ points: s.trim() }))
    : [];

  const warrantyArr = warranty
    ? warranty.split(",").map((w) => ({ points: w.trim() }))
    : [];

  const bulkData = titles.map((title) => ({
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
    specifications: specArr,
    warranty: warrantyArr,
  }));

  return Accessorize.insertMany(bulkData);
};

export const getAllProductsService = () => {
  return Accessorize.find({ status: "Live" }).lean();
};

export const getAllProductService = () => {
  return Accessorize.find({ status: { $in: ["Padding", "Enquiry"] } }).lean();
};

export const getProductByIdService = (id) => {
  return Accessorize.findById(id);
};

export const updateProductStatusService = async (id, status) => {
  const allowedStatuses = ["Padding", "Live", "Enquiry"];
  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid status value");
  }

  const product = await Accessorize.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};






// Controller



export const deleteProductService = async (id) => {
  const product = await Accessorize.findById(id);
  if (!product) throw new Error("Product not found");


  await product.deleteOne();
  return { success: true, message: "Product deleted successfully" };
};

