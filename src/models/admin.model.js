import mongoose from "mongoose";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true, 
    },
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    imageUrl: { type: String, default: null },
    role: { type: String, enum: ["admin"], default: "admin" },
    accessToken: { type: String, default: null },
    tokenExpiresAt: { type: Date, default: null },
    isVerified:{
      type:Boolean,
      default:false
    }
  },
  { timestamps: true }
);

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return ;

  const saltRounds = 6;

  this.password = await bcrypt.hash(this.password, saltRounds);
});

// Method to compare password during login
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Admin = mongoose.model("Admin", adminSchema);
