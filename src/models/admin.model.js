import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: null },
    role: { type: String, enum: ["admin"], default: "admin" },
    accessToken: { type: String, default: null },
    tokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRounds = 6;

  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Method to compare password during login
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Admin = mongoose.model("Admin", adminSchema);
