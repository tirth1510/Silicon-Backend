import mongoose from "mongoose";

/* ================= IMAGE SCHEMA ================= */
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true },
  },
  { _id: false }
);

/* ================= PRICE SCHEMA ================= */
const priceSchema = new mongoose.Schema(
  {
    currency: { type: String, default: "INR", uppercase: true },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    finalPrice: { type: Number, min: 0 },
  },
  { _id: false }
);

/* ================= MAIN PRODUCT SCHEMA ================= */
const accessorizeSchema = new mongoose.Schema(
  {
    productCategory: {
      type: String,
      required: true,
     
      index: true,
    },

    productTitle: { type: String, required: true, trim: true, index: true },

    description: { type: String, required: true, trim: true },

    status: { type: String, enum: ["Padding", "Live", "Enquiry"], default: "Padding" },

    priceDetails: { type: priceSchema, required: true },

    stock: { type: Number, default: 0, min: 0 },

    productImageUrl: { type: [imageSchema], default: [] },

    productGallery: { type: [imageSchema], default: [] },

    specifications: { type: [{ points: String }], default: [] },

    // ✅ Fixed productSpecifications field
    productSpecifications: {
      type: [
        {
          key: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
      default: [], // ensures new products have an empty array if not provided
    },

    warranty: { type: [{ points: String }], default: [] },
  },
  { timestamps: true }
);

/* ================= AUTO FINAL PRICE ================= */


accessorizeSchema.pre("save", function () {
  if (this.price != null) {
    this.finalPrice = this.price - Math.round((this.price * (this.discount || 0)) / 100);
  }
});

/* ================= EXPORT ================= */
export const Accessorize = mongoose.model("Accessorize", accessorizeSchema);
