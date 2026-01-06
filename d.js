import { Readable } from "stream";
import { Accessorize } from "../models/accessorize.model.js";
import cloudinary from "../config/cloudinary.js";

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

/* ================= UPDATE PRODUCT ================= */
router.put(
  "/:id",
  upload.fields([
    { name: "productImageUrl", maxCount: 1 },
    { name: "productGallery", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // ✅ Defensive: only allow fields that exist in schema
      const allowedUpdates = [
        "productCategory",
        "productTitle",
        "description",
        "status",
        "priceDetails",
        "stock",
        "specifications",
        "productSpecifications",
        "warranty",
      ];

      const updates = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }

      // Fetch product once at the top
      const productDoc = await Accessorize.findById(id);
      if (!productDoc) {
        return res.status(404).json({ message: "Product not found" });
      }

      // ✅ productSpecifications
      if (req.body.productSpecifications) {
        try {
          const incomingSpecs = JSON.parse(req.body.productSpecifications);
          if (!Array.isArray(incomingSpecs)) {
            return res
              .status(400)
              .json({ message: "productSpecifications must be an array" });
          }

          const currentSpecs = Array.isArray(productDoc.productSpecifications)
            ? productDoc.productSpecifications
            : [];

          if (!req.body.specIndexes && req.body.deleteIndex === undefined) {
            // Append
            updates.productSpecifications = [...currentSpecs, ...incomingSpecs];
          } else if (req.body.specIndexes) {
            // Replace
            const indexes = Array.isArray(req.body.specIndexes)
              ? req.body.specIndexes.map(Number)
              : [Number(req.body.specIndexes)];
            indexes.forEach((idx, i) => {
              if (incomingSpecs[i]) currentSpecs[idx] = incomingSpecs[i];
            });
            updates.productSpecifications = currentSpecs;
          } else if (req.body.deleteIndex !== undefined) {
            // Delete
            const idx = Number(req.body.deleteIndex);
            if (!isNaN(idx) && currentSpecs[idx]) currentSpecs.splice(idx, 1);
            updates.productSpecifications = currentSpecs;
          }
        } catch (err) {
          return res
            .status(400)
            .json({ message: "Invalid JSON for productSpecifications" });
        }
      }

      // ✅ specifications
      if (req.body.specifications) {
        try {
          const incomingSpecs = JSON.parse(req.body.specifications);
          if (!Array.isArray(incomingSpecs)) {
            return res
              .status(400)
              .json({ message: "Specifications must be an array" });
          }

          const currentSpecs = Array.isArray(productDoc.specifications)
            ? productDoc.specifications
            : [];

          if (
            !req.body.specificationIndexes &&
            req.body.deleteSpecificationIndex === undefined
          ) {
            updates.specifications = [...currentSpecs, ...incomingSpecs];
          } else if (req.body.specificationIndexes) {
            const indexes = Array.isArray(req.body.specificationIndexes)
              ? req.body.specificationIndexes.map(Number)
              : [Number(req.body.specificationIndexes)];
            indexes.forEach((idx, i) => {
              if (incomingSpecs[i]) currentSpecs[idx] = incomingSpecs[i];
            });
            updates.specifications = currentSpecs;
          } else if (req.body.deleteSpecificationIndex !== undefined) {
            const idx = Number(req.body.deleteSpecificationIndex);
            if (!isNaN(idx) && currentSpecs[idx]) {
              currentSpecs.splice(idx, 1); // remove at index
            }
            updates.specifications = currentSpecs; // reassign full array
          }
        } catch (err) {
          return res
            .status(400)
            .json({ message: "Invalid JSON for specifications" });
        }
      }

      // ✅ warranty
      if (req.body.warranty) {
        try {
          const incomingWarranty = JSON.parse(req.body.warranty);
          if (!Array.isArray(incomingWarranty)) {
            return res
              .status(400)
              .json({ message: "Warranty must be an array" });
          }

          const currentWarranty = Array.isArray(productDoc.warranty)
            ? productDoc.warranty
            : [];

          if (
            !req.body.warrantyIndexes &&
            req.body.deleteWarrantyIndex === undefined
          ) {
            updates.warranty = [...currentWarranty, ...incomingWarranty];
          } else if (req.body.warrantyIndexes) {
            const indexes = Array.isArray(req.body.warrantyIndexes)
              ? req.body.warrantyIndexes.map(Number)
              : [Number(req.body.warrantyIndexes)];
            indexes.forEach((idx, i) => {
              if (incomingWarranty[i])
                currentWarranty[idx] = incomingWarranty[i];
            });
            updates.warranty = currentWarranty;
          } else if (req.body.deleteWarrantyIndex !== undefined) {
            const idx = Number(req.body.deleteWarrantyIndex);
            if (!isNaN(idx) && currentWarranty[idx])
              currentWarranty.splice(idx, 1);
            updates.warranty = currentWarranty;
          }
        } catch (err) {
          return res.status(400).json({ message: "Invalid JSON for warranty" });
        }
      }

      // ✅ Handle uploaded files
      if (req.files.productImageUrl) {
        const uploaded = await Promise.all(
          req.files.productImageUrl.map((file) =>
            uploadToCloudinary(file.buffer)
          )
        );
        updates.productImageUrl = uploaded.map((img) => ({
          url: img.secure_url,
        }));
      }

      if (req.files.productGallery) {
  const uploaded = await Promise.all(
    req.files.productGallery.map((file) =>
      uploadToCloudinary(file.buffer)
    )
  );

  // Fetch current product
  const product = await Accessorize.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  let currentGallery = Array.isArray(product.productGallery)
    ? [...product.productGallery]
    : [];

  // ✅ Replace at specific index
  if (req.body.replaceGalleryIndex !== undefined) {
    const idx = Number(req.body.replaceGalleryIndex);
    if (!isNaN(idx) && idx >= 0 && idx < currentGallery.length) {
      // Replace the image at index with the first uploaded file
      currentGallery[idx] = { url: uploaded[0].secure_url };
    }
    updates.productGallery = currentGallery;
  } else {
    // ✅ Append new images
    updates.productGallery = [
      ...currentGallery,
      ...uploaded.map((img) => ({ url: img.secure_url })),
    ];
  }
}



      // ✅ Find & update
      const product = await Accessorize.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);