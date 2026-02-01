import { Contact } from "../models/contact.model.js";
import { sendEmail } from "../utils/mailer.js";
import { v4 as uuidv4 } from "uuid"; // import uuid
import twilio from "twilio";

const COMPANY_LOGO_URL =
  "https://res.cloudinary.com/dq4hevka1/image/upload/v1766235630/products/product-images/gbhs2ft4m5fqvwue0kol.png";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsappNumber =
  process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

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

    // 1. Validation
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, and message are required",
      });
    }

    const contactId = uuidv4();
    // Phone number format fix for WhatsApp
    const formattedUserPhone = phone.startsWith("+")
      ? phone
      : `+${phone.replace(/\s+/g, "")}`;

    // 2. Save contact in Database
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

    const emailHeader = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto;"/>
      </div>
    `;

    // 3. Send notification email to Admin
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

    // 4. Send acknowledgement email to User
    await sendEmail({
      to: email,
      subject: "We received your message",
      html: `
        ${emailHeader}
        <h2>Hello ${name},</h2>
        <p>Thank you for contacting us. We have received your inquiry and our team will get back to you shortly.</p>
      `,
    });

    // 5. --- WhatsApp Automation ---
    if (twilioClient) {
      try {
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER.startsWith("+")
          ? process.env.ADMIN_WHATSAPP_NUMBER
          : `+${process.env.ADMIN_WHATSAPP_NUMBER}`;

        // Fixed Admin Message String
        const adminMsg =
          `🆕 *Enquiry Details*\n\n` +
          `👤 *Name:* ${name}\n` +
          `✉️ *Email:* ${email}\n` +
          `📞 *Phone:* ${phone}\n` +
          `🏢 *Company:* ${companyName || "N/A"}\n` +
          `📍 *Location:* ${companyLocation || "N/A"}\n` +
          `📝 *Title:* ${messageTitle || "N/A"}\n` +
          `📝 *Message:* ${message}`;

        // Send to Admin
        await twilioClient.messages.create({
          body: adminMsg,
          from: `whatsapp:${twilioWhatsappNumber}`,
          to: `whatsapp:${adminPhone}`,
        });

        // Send Thank You to User
        const userMsg = `Hello *${name}*! 👋\n\nThank you for reaching out to *Silicon Meditech*. We have received your inquiry. Our team will contact you soon!`;

        await twilioClient.messages.create({
          body: userMsg,
          from: `whatsapp:${twilioWhatsappNumber}`,
          to: `whatsapp:${formattedUserPhone}`,
        });
      } catch (waError) {
        console.error("WhatsApp Error:", waError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Contact saved and notifications sent via Email & WhatsApp",
      data: newContact,
    });
  } catch (error) {
    console.error("CONTACT ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const sendResponse = async (req, res) => {
  try {
    const { contactId, responseMessage, sendWhatsapp } = req.body;

    if (!contactId || !responseMessage) {
      return res.status(400).json({
        success: false,
        message: "Contact ID and response message are required",
      });
    }

    const contact = await Contact.findOne({ contactId });
    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }
    const emailHeader = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto;"/>
      </div>
    `;

    // Send Email Response
    await sendEmail({
      to: contact.email,
      subject: "Response to your inquiry",
      html: `${emailHeader}<h2>Hello ${contact.name},</h2><p>${responseMessage}</p>`,
    });

    // Optional WhatsApp

   return res
      .status(200)
      .json({ success: true, message: "Response sent successfully" });
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

    // 1. Validation
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: "Name, email, phone, and message are required",
      });
    }

    const contactId = uuidv4();
    const formattedUserPhone = phone.startsWith("+")
      ? phone
      : `+${phone.replace(/\s+/g, "")}`;

    // 2. Database mein save karein
    const newEnquiry = await Contact.create({
      contactId,
      name,
      email,
      phone: formattedUserPhone,
      message,
      enquiryType: "Product",
      productTitle,
      modelName,
      productImageUrl,
      productId,
      modelId,
    });

    const emailHeader = `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto;"/>
      </div>
    `;

    // 3. Admin Notification Email
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

    // 4. User Acknowledgement Email
    await sendEmail({
      to: email,
      subject: `Enquiry Received: ${productTitle}`,
      html: `
        ${emailHeader}
        <h2>Hello ${name},</h2>
        <p>Thank you for inquiring about our <strong>${productTitle}</strong>.</p>
        <p>Our sales team has received your request and will provide the details shortly.</p>
        <p>Enquiry ID: #${contactId.slice(0, 8)}</p>
      `,
    });

    // 5. --- WhatsApp Automation via Twilio ---
    if (twilioClient) {
      try {
        const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER.startsWith("+")
          ? process.env.ADMIN_WHATSAPP_NUMBER
          : `+${process.env.ADMIN_WHATSAPP_NUMBER}`;

        // A. Admin Notification (WhatsApp)
        const adminMsg =
          `📦 *New Product Enquiry*\n\n` +
          `🛍️ *Product:* ${productTitle}\n` +
          `🔢 *Model:* ${modelName || "N/A"}\n` +
          `👤 *Client:* ${name}\n` +
          `📞 *Phone:* ${phone}\n` +
          `📝 *Message:* ${message}`;

        await twilioClient.messages.create({
          body: adminMsg,
          mediaUrl: [productImageUrl || COMPANY_LOGO_URL], // Admin ko product image dikhegi
          from: `whatsapp:${twilioWhatsappNumber}`,
          to: `whatsapp:${adminPhone}`,
        });

        // B. User "Thank You" (WhatsApp)
        const userMsg = `Hello *${name}*! 👋\n\nThank you for your interest in *${productTitle}* at *Silicon Meditech*. Our team will contact you soon with the pricing and details!`;

        await twilioClient.messages.create({
          body: userMsg,
          from: `whatsapp:${twilioWhatsappNumber}`,
          to: `whatsapp:${phone}`,
        });
      } catch (waError) {
        console.error("WhatsApp Error:", waError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Product enquiry submitted successfully via Email & WhatsApp",
      data: newEnquiry,
    });
  } catch (error) {
    console.error("PRODUCT ENQUIRY ERROR:", error);
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
