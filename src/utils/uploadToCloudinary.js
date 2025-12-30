// src/utils/uploadToCloudinary.js
import multer from "multer";
import multerCloudinaryPkg from "multer-storage-cloudinary";
const { CloudinaryStorage } = multerCloudinaryPkg;
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "product_colors",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  },
});

export const upload = multer({ storage });
