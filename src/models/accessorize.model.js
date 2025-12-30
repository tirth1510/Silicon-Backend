import mongoose from "mongoose";

/* ================= IMAGE SCHEMA ================= */
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

/* ================= PRICE SCHEMA ================= */
const priceSchema = new mongoose.Schema(
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
      type: Number, // percentage (0–100)
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

/* ================= MAIN PRODUCT SCHEMA ================= */
const accessorizeSchema = new mongoose.Schema(
  {
    productCategory: {
      type: String,
      required: true,
      enum: [
        "SPO2 PROBE",
        "MEDICAL BETTERIES",
        "CAUTERY ACCESSORIES",
        "VENTILATOR ACCESSORIES",
        "VENTILATOR CIRCUIT",
        "FLOW/OXYGEN SENSOR",
        "KEY PAD",
        "WARMER & MONITOR TEMP SENSOR",
        "HUMIDIFIER TEAMPERATURE SENSOR",
        "NIBP ACCESSORIES",
        "IBP CABLE",
        "IBP TRANSDUCER KIT",
        "ECG CLAMP/BULB & ROLL",
        "3/5 LEAD EGG CABLE",
        "10 LEAD ECG CABLE",
        "AVAILABLE FOR",
      ],
      index: true,
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

    priceDetails: {
      type: priceSchema,
      required: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    productImageUrl: {
      type: [imageSchema],
      default: [],
    },

    productGallery: {
      type: [imageSchema],
      default: [],
    },

    specifications: {
      type: [{ points: String }],
      default: [],
    },

    warranty: {
      type: [{ points: String }],
      default: [],
    },
  },
  { timestamps: true }
);

/* ================= AUTO FINAL PRICE ================= */
accessorizeSchema.pre("save", function (next) {
  const { price, discount } = this.priceDetails;

  this.priceDetails.finalPrice =
    discount > 0
      ? Math.round(price - (price * discount) / 100)
      : price;

  next();
});

/* ================= EXPORT ================= */
export const Accessorize = mongoose.model(
  "Accessorize",
  accessorizeSchema
);
