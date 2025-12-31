import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    contactId: { type: String, unique: true },  
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    companyName: String,
    companyEmail: String,
    companyPhoneNumber: String,
    companyLocation: String,
    messageTitle: String,
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Contact = mongoose.model("Contact", contactSchema);
