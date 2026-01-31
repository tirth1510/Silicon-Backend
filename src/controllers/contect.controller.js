import { Contact } from "../models/contact.model.js";
import { sendEmail } from "../utils/mailer.js";
import { v4 as uuidv4 } from "uuid"; // import uuid

const COMPANY_LOGO_URL = "https://res.cloudinary.com/dq4hevka1/image/upload/v1766235630/products/product-images/gbhs2ft4m5fqvwue0kol.png"
export const createContact = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      companyName,
      companyEmail,
      companyLocation,
      companyPhoneNumber,
      messageTitle,
      message,
    } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, and message are required",
      });
    }

    // Generate unique contact ID
    const contactId = uuidv4();

    // Save contact
    const newContact = await Contact.create({
      contactId,
      name,
      email,
      phone,
      companyName,
      companyEmail,
      companyLocation,
      companyPhoneNumber,
      messageTitle,
      message,
      enquiryType: "General",
    });

    // Send notification email to Admin
    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `New Contact Inquiry from ${name}`,
      html: `
        <h3>New Message Received</h3>
        <p><strong>Contact ID:</strong> ${contactId}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Company:</strong> ${companyName || "N/A"}</p>
        <p><strong>Title:</strong> ${messageTitle || "N/A"}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    // Send acknowledgement email
    await sendEmail({
      to: email,
      subject: "We received your message",
      html: `<h2>Hello ${name},</h2>
             <p>Thank you for contacting us. We have received your message regarding "<strong>${messageTitle || 'Inquiry'}</strong>".</p>
             <p>We will get back to you shortly.</p>`,
    });

    return res.status(201).json({
      success: true,
      message: "Contact saved and acknowledgement email sent",
      data: newContact,
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
};

export const sendResponse = async (req, res) => {
  try {
    const { contactId, responseMessage, sendWhatsapp } = req.body;

    if (!contactId || !responseMessage) {
      return res.status(400).json({ success: false, message: "Contact ID and response message are required" });
    }

    const contact = await Contact.findOne({ contactId });
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    // Send Email Response
    await sendEmail({
      to: contact.email,
      subject: "Response to your inquiry",
      html: `<h2>Hello ${contact.name},</h2><p>${responseMessage}</p>`,
    });

    // Optional WhatsApp
    if (sendWhatsapp && contact.phone) {
      // TODO: Implement WhatsApp sending logic here
      console.log(`[WhatsApp] Sending message to ${contact.phone}: ${responseMessage}`);
    }

    return res.status(200).json({ success: true, message: "Response sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createProductEnquiry = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      productTitle,
      modelName,
      productImageUrl,
      productId,
      modelId,
    } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, and message are required",
      });
    }

    const contactId = uuidv4();

    const newEnquiry = await Contact.create({
      contactId,
      name,
      email,
      phone,
      message,
      enquiryType: "Product",
      productTitle,
      modelName,
      productImageUrl,
      productId,
      modelId,
      
    });

    // Admin Notification
    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `Product Enquiry: ${productTitle} - ${modelName}`,
      html: `
      <img src="${COMPANY_LOGO_URL}" alt="Company Logo" style="width: 180px; margin-bottom: 20px;"/>
        <h3>New Product Enquiry</h3>
        <p><strong>Contact ID:</strong> ${contactId}</p>
        <p><strong>Product:</strong> ${productTitle}</p>
        <p><strong>Model:</strong> ${modelName}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong><br/>${message}</p>
        ${productImageUrl ? `<img src="${productImageUrl}" alt="Product Image" style="max-width: 200px;"/>` : ""}
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Product enquiry submitted successfully",
      data: newEnquiry,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductEnquiries = async (req, res) => {
  try {
    const enquiries = await Contact.find({ enquiryType: "Product" }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const sendWhatsappMessage = async (req, res) => {
  try {
    const { contactId, message } = req.body;

    if (!contactId || !message) {
      return res.status(400).json({ success: false, message: "Contact ID and message are required" });
    }

    const contact = await Contact.findOne({ contactId });
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    // Placeholder for WhatsApp integration
    console.log(`[WhatsApp] Sending message to ${contact.phone}: ${message}`);

    return res.status(200).json({ success: true, message: "WhatsApp message sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
