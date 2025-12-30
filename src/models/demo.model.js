import mongoose from "mongoose";

/* ---------- PRODUCT SELL SCHEMA ---------- */
const productSellSchema = new mongoose.Schema(
  {
    saleProduct: { type: Boolean, default: false },
    tradingProduct: { type: Boolean, default: false },
    companyProduct: { type: Boolean, default: false },
    valuableProduct: { type: Boolean, default: false },
    recommendedProduct: { type: Boolean, default: false },
  },
  { _id: true }
);

/* ---------- IMAGE SCHEMA ---------- */
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

/* ---------- PRICE SCHEMA ---------- */
const productPriceSchema = new mongoose.Schema(
  {
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
      min: 0,
    },
  },
  { _id: true }
);

/* ---------- AUTO FINAL PRICE ---------- */
productPriceSchema.pre("save", function () {
  if (this.price != null) {
    this.finalPrice = this.price - Math.round((this.price * (this.discount || 0)) / 100);
  }
});

/* ---------- COLOR SCHEMA ---------- */
const colorImageSchema = new mongoose.Schema(
  {
    colorName: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    productImageUrl: {
      type: [imageSchema],
      default: [],
    },
    productGallery: {
      type: [imageSchema],
      default: [],
    },
    colorPrice: {
      type: [productPriceSchema],
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    addtionalDetails : [
      {
        key: String,
        value: String,
      },
    ],
  },
  { _id: true }
);

/* ---------- PRODUCT MODEL DETAILS (OPTIONAL) ---------- */

const productModelDetailsSchema = new mongoose.Schema(
  {
    colors: {
      type: [colorImageSchema],
      default: [],
    },
    specifications: {
      type: [{ points: String }],
      default: [],
    },
    productSpecifications: [
      {
        key: String,
        value: String,
      },
    ],
    productFeatures: [
      {
        key: String,
        value: String,
      },
    ],
    productFeaturesIcons: {
      type: [String],
      default: [],
    },
    standardParameters: [
      {
        iconName: {
          type: String,
          enum: ["ECG", "RESPIRATION", "SPO2", "NIBP", "TEMP", "PR"],
        },
      },
    ],
    optiomalParameters: [
      {
        iconName: {
          type: String,
          enum: ["ETCO2", "IBP"],
        },
      },
    ],
    warranty: {
      type: [{ points: String }],
      default: [],
    },
    schem: {
      type: productSellSchema,
      default: {},
    },
  },
  { _id: false }
);

/* ---------- MODEL SCHEMA ---------- */
const modelSchema = new mongoose.Schema(
  {
    modelName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Padding","Live","Enquiry"],
      default: "Padding",
    },

    // ✅ OPTIONAL FIELD
    productModelDetails: {
      type: productModelDetailsSchema,
      default: null,
      required: false,
    },
  },
  { _id: true }
);

/* ---------- PRODUCT SCHEMA ---------- */
const productSchema = new mongoose.Schema(
  {
    productCategory: {
      type: String,
      enum: ["1", "2", "3", "4"],
      required: true,
    },
    productTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    productModels: {
      type: [modelSchema],
      default: [],
    },
  },
  { timestamps: true }
);

/* ---------- EXPORT MODEL ---------- */
export const Demo = mongoose.model("Demo", productSchema);
