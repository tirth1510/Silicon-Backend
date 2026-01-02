import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: Number,
      required: true,
      unique: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    categorySlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      productCount: {
        type: Number,
        default: 0,
      },
      createdBy: {
        type: String,
        default: "system",
      },
      lastModifiedBy: {
        type: String,
        default: "system",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for isActive (categoryId and categorySlug already have unique: true)
categorySchema.index({ isActive: 1 });

export const Category = mongoose.model("Category", categorySchema);

