import { Contact } from "../models/contact.model.js";
import { sendEmail } from "../utils/mailer.js";
import { v4 as uuidv4 } from "uuid"; // import uuid
import twilio from "twilio";
import axios from "axios";

const COMPANY_LOGO_URL =
  "https://res.cloudinary.com/dq4hevka1/image/upload/v1766235630/products/product-images/gbhs2ft4m5fqvwue0kol.png";


// --- Meta WhatsApp Helper Function ---
const sendMetaWhatsApp = async (to, message) => {
  try {
    const phoneId = process.env.META_PHONE_NUMBER_ID;
    const token = process.env.META_ACCESS_TOKEN;

    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/\D/g, ""), // ફક્ત આંકડા જ મોકલવા
        type: "text",
        text: { body: message },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (err) {
    console.error("Meta WhatsApp Error:", err.response?.data || err.message);
  }
};

// 1. Create General Contact Enquiry
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
      return res.status(400).json({ success: false, error: "Name, email, phone, and message are required" });
    }

    const contactId = uuidv4();
    const formattedUserPhone = phone.replace(/\D/g, "");

    const newContact = await Contact.create({
      contactId,
      name,
      email,
      phone: formattedUserPhone,
      companyName,
      companyEmail,
      companyLocation,
      companyPhoneNumber,
      messageTitle,
      message,
      enquiryType: "Enquiry",
    });

    const emailHeader = `<div style="text-align: center; margin-bottom: 20px;"><img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto;"/></div>`;

    // Admin Notification Email
    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `New Inquiry from ${name}`,
      html: `
        ${emailHeader}
        <h3>New Message Received</h3>
        <p><strong>Contact ID:</strong> ${contactId}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Company:</strong> ${companyName || "N/A"}</p>
        <p><strong>Location:</strong> ${companyLocation || "N/A"}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    // User Acknowledgement Email
    await sendEmail({
      to: email,
      subject: "We received your message",
      html: `
        ${emailHeader}
        <h2>Hello ${name},</h2>
        <p>Thank you for contacting us. We have received your inquiry and our team will get back to you shortly.</p>
      `,
    });

    // Meta WhatsApp Notifications
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
    const adminMsg = `🆕 *Enquiry Details*\n\n👤 *Name:* ${name}\n✉️ *Email:* ${email}\n📞 *Phone:* ${phone}\n🏢 *Company:* ${companyName || "N/A"}\n📝 *Message:* ${message}`;
    await sendMetaWhatsApp(adminPhone, adminMsg);

    const userMsg = `Hello *${name}*! 👋\n\nThank you for reaching out to *Silicon Meditech*. We have received your inquiry. Our team will contact you soon!`;
    await sendMetaWhatsApp(formattedUserPhone, userMsg);

    return res.status(201).json({ success: true, message: "Contact saved and notifications sent via Email & Meta WhatsApp", data: newContact });
  } catch (error) {
    console.error("CONTACT ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Create Product Enquiry
export const createProductEnquiry = async (req, res) => {
  try {
    const {
      name, email, phone, message, productTitle, modelName, productImageUrl, productId, modelId,
    } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, error: "Name, email, phone, and message are required" });
    }

    const contactId = uuidv4();
    const formattedUserPhone = phone.replace(/\D/g, "");

    const newEnquiry = await Contact.create({
      contactId, name, email, phone: formattedUserPhone, message, enquiryType: "Product", productTitle, modelName, productImageUrl, productId, modelId,
    });

    const emailHeader = `<div style="text-align: center; margin-bottom: 20px;"><img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto;"/></div>`;

    // Admin Notification Email
    await sendEmail({
      to: process.env.SMTP_USER,
      subject: `Product Enquiry: ${productTitle} - ${modelName}`,
      html: `
        ${emailHeader}
        <h3>New Product Enquiry Received</h3>
        <p><strong>Product:</strong> ${productTitle} (${modelName})</p>
        <p><strong>Client Name:</strong> ${name}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
        ${productImageUrl ? `<br/><img src="${productImageUrl}" alt="Product" style="max-width: 250px; border: 1px solid #ddd; padding: 5px;"/>` : ""}
      `,
    });

    // User Acknowledgement Email
    await sendEmail({
      to: email,
      subject: `Enquiry Received: ${productTitle}`,
      html: `
        ${emailHeader}
        <h2>Hello ${name},</h2>
        <p>Thank you for inquiring about our <strong>${productTitle}</strong>.</p>
        <p>Enquiry ID: #${contactId.slice(0, 8)}</p>
      `,
    });

    // Meta WhatsApp Notifications
    const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
    const adminMsg = `📦 *New Product Enquiry*\n\n🛍️ *Product:* ${productTitle}\n👤 *Client:* ${name}\n📞 *Phone:* ${phone}\n📝 *Message:* ${message}`;
    await sendMetaWhatsApp(adminPhone, adminMsg);

    const userMsg = `Hello *${name}*! 👋\n\nThank you for your interest in *${productTitle}* at *Silicon Meditech*. Our team will contact you soon!`;
    await sendMetaWhatsApp(formattedUserPhone, userMsg);

    return res.status(201).json({ success: true, message: "Product enquiry submitted successfully", data: newEnquiry });
  } catch (error) {
    console.error("PRODUCT ENQUIRY ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Send Manual Response
export const sendResponse = async (req, res) => {
  try {
    const { contactId, responseMessage } = req.body;

    if (!contactId || !responseMessage) {
      return res.status(400).json({ success: false, message: "Contact ID and response message are required" });
    }

    const contact = await Contact.findOne({ contactId });
    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    const emailHeader = `<div style="text-align: center; margin-bottom: 20px;"><img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto;"/></div>`;

    await sendEmail({
      to: contact.email,
      subject: "Response to your inquiry",
      html: `
        ${emailHeader}
        <h2>Hello ${contact.name},</h2>
        <p>${responseMessage}</p>
      `,
    });

    const userMsg = `Hello *${contact.name}*! 👋\n\n*${responseMessage}*`;
    await sendMetaWhatsApp(contact.phone, userMsg);

    return res.status(200).json({ success: true, message: "Response sent successfully via Email" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
export const getProductEnquiries = async (req, res) => {
  try {
    const enquiries = await Contact.find({ enquiryType: "Product" }).sort({
      createdAt: -1,
    });
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
      return res.status(400).json({
        success: false,
        message: "Contact ID and message are required",
      });
    }

    const contact = await Contact.findOne({ contactId });
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    // Placeholder for WhatsApp integration
    console.log(`[WhatsApp] Sending message to ${contact.phone}: ${message}`);

    return res
      .status(200)
      .json({ success: true, message: "WhatsApp message sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
