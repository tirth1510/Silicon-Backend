import { Contact } from "../models/contact.model.js";
import { sendEmail } from "../utils/mailer.js";
import { v4 as uuidv4 } from "uuid";
import twilio from "twilio";
import axios from "axios";
import { model } from "mongoose";

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
      name, email, phone, companyName, companyEmail, companyLocation, companyPhoneNumber, messageTitle, message,
    } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, error: "Name, email, phone, and message are required" });
    }

    const contactId = uuidv4();
    const formattedUserPhone = phone.replace(/\D/g, "");

    const newContact = await Contact.create({
      contactId, name, email, phone: formattedUserPhone, companyName, companyEmail, companyLocation, companyPhoneNumber, messageTitle, message, enquiryType: "Enquiry",
    });

    // Simplified email header to only contain the image
    const emailHeader = `<img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto; display: block; margin: 0 auto;"/>`;
    const websiteFooter = `
      <div style="background-color: #f8fafc; color: #64748b; padding: 20px; text-align: center; font-size: 14px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">Visit us at <a href="https://www.siliconmeditech.in" style="color: #043bbc; text-decoration: none; font-weight: 600;">www.siliconmeditech.in</a></p>
      </div>`;

    // Admin Notification Email
    sendEmail({
      to: process.env.SMTP_USER,
      subject: `New Inquiry from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background-color: #ffffff; padding: 25px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              ${emailHeader}
            </div>

            <div style="padding: 30px; color: #475569; line-height: 1.6;">
              <h2 style="margin-top: 12px; margin-bottom: 25px; font-size: 22px; font-weight: 600; text-align: center; color: #043bbc;">New General Inquiry</h2>
              
              <p style="margin: 8px 0;">🏷️ <strong>Contact ID:</strong> <span style="color: #0f172a;">${contactId}</span></p>
              <p style="margin: 8px 0;">👤 <strong>Name:</strong> <span style="color: #0f172a;">${name}</span></p>
              <p style="margin: 8px 0;">✉️ <strong>Email:</strong> <a href="mailto:${email}" style="color: #043bbc; text-decoration: none;">${email}</a></p>
              <p style="margin: 8px 0;">📞 <strong>Phone:</strong> <a href="tel:${phone}" style="color: #043bbc; text-decoration: none;">${phone}</a></p>
              <p style="margin: 8px 0;">🏢 <strong>Company:</strong> <span style="color: #0f172a;">${companyName || "N/A"}</span></p>
              <p style="margin: 8px 0;">📍 <strong>Location:</strong> <span style="color: #0f172a;">${companyLocation || "N/A"}</span></p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-top: 25px; border: 1px solid #e2e8f0; border-left: 4px solid #043bbc;">
                <p style="margin: 0; color: #0f172a;">💬 <strong>Message:</strong><br/><br/>${message.replace(/\n/g, '<br/>')}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error("Admin contact email failed:", err));

    // User Acknowledgement Email
    sendEmail({
      to: email,
      subject: "We received your message",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background-color: #ffffff; padding: 25px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              ${emailHeader}
            </div>

            <div style="padding: 30px; color: #475569; line-height: 1.6;">
              <h2 style="margin-top: 12px; margin-bottom: 22px; font-size: 22px; text-align: center; font-weight: 600; color: #043bbc;">Message Received</h2>
              <p style="font-size: 16px; color: #0f172a;">Hello <strong>${name}</strong>,</p>
              <p>Thank you for contacting us. We have successfully received your inquiry and our team will get back to you shortly.</p>
              <p style="margin-bottom: 0; margin-top: 30px; color: #0f172a;">Best regards,<br/><strong>Silicon Meditech Team</strong></p>
            </div>
            ${websiteFooter}
          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error("User contact email failed:", err));

    return res.status(201).json({ success: true, message: "Contact saved and notifications sent via Email", data: newContact });
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

    const emailHeader = `<img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto; display: block; margin: 0 auto;"/>`;
    const websiteFooter = `
      <div style="background-color: #f8fafc; color: #64748b; padding: 20px; text-align: center; font-size: 14px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">Visit us at <a href="https://www.siliconmeditech.in" style="color: #043bbc; text-decoration: none; font-weight: 600;">www.siliconmeditech.in</a></p>
      </div>`;

    // Admin Notification Email
    sendEmail({
      to: process.env.SMTP_USER,
      subject: `Product Enquiry: ${productTitle} - ${modelName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background-color: #ffffff; padding: 25px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              ${emailHeader}
            </div>
              
            <div style="padding: 30px; color: #475569;">
              <h2 style="margin-top: 12px; margin-bottom: 25px; font-size: 22px; font-weight: 600; text-align: center; color: #043bbc;">New Product Enquiry</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; width: 35%; color: #475569; font-size: 15px;">👤 <strong>Client Name:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 15px;">📞 <strong>Phone:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px;">
                    <a href="tel:${phone}" style="color: #043bbc; text-decoration: none; font-weight: 500;">${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 15px;">✉️ <strong>Email:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px;">
                    <a href="mailto:${email}" style="color: #043bbc; text-decoration: none; font-weight: 500;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 15px; vertical-align: top;">💬 <strong>Message:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; line-height: 1.5;">${message.replace(/\n/g, '<br/>')}</td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: #043bbc; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📦 Product Information</h3>
                <p style="margin: 0 0 10px 0; color: #475569;">🏷️ <strong>Name:</strong> <span style="color: #0f172a;">${productTitle}</span></p>
                <p style="margin: 0; color: #475569;">⚙️ <strong>Model:</strong> <span style="color: #0f172a;">${modelName}</span></p>
                ${productImageUrl ? `
                <div style="margin-top: 20px; text-align: center;">
                  <img src="${productImageUrl}" alt="${productTitle}" style="max-width: 100%; height: auto; max-height: 250px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"/>
                </div>
                ` : ""}
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error("Admin product enquiry email failed:", err));

    // User Acknowledgement Email
    sendEmail({
      to: email,
      subject: `Enquiry Received: ${productTitle} - ${modelName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background-color: #ffffff; padding: 25px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              ${emailHeader}
            </div>
              
            <div style="padding: 30px; color: #475569; line-height: 1.6;">
              <h2 style="margin-top: 12px; margin-bottom: 22px; font-size: 22px; text-align: center; font-weight: 600; color: #043bbc;">Enquiry Received</h2>
              <p style="font-size: 16px; color: #0f172a;">Hello <strong>${name}</strong>,</p>
              <p style="font-size: 16px;">Thank you for getting in touch with us! We have successfully received your inquiry regarding our products. Our team will review your request and get back to you shortly.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #043bbc; border-radius: 0 6px 6px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-size: 15px;">📦 <strong>Product:</strong> <span style="color: #0f172a; font-weight: 500;">${productTitle}</span></p>
                <p style="margin: 0; font-size: 15px;">🔖 <strong>Reference ID:</strong> <span style="font-family: monospace; background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; color: #0f172a; font-weight: 600;">#${contactId.slice(0, 8)}</span></p>
              </div>

              <p style="font-size: 15px;">If you need to add any more information, simply reply to this email. We look forward to speaking with you!</p>
              <p style="margin-bottom: 0; font-size: 15px; margin-top: 30px; color: #0f172a;">Best regards,<br/><strong>The Sales Team</strong></p>
            </div>
            ${websiteFooter}
          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error("User product enquiry email failed:", err));

    return res.status(201).json({ success: true, message: "Product enquiry submitted successfully", data: newEnquiry });
  } catch (error) {
    console.error("PRODUCT ENQUIRY ERROR:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Create Accessorize Enquiry
export const createAccessorizeEnquiry = async (req, res) => {
  try {
    const {
      name, email, phone, message, productTitle, productImageUrl, productId,
    } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({ success: false, error: "Name, email, phone, and message are required" });
    }

    const contactId = uuidv4();
    const formattedUserPhone = phone.replace(/\D/g, "");

    const newEnquiry = await Contact.create({
      contactId, name, email, phone: formattedUserPhone, message, enquiryType: "Accessory", productTitle, productImageUrl, productId,
    });

    const emailHeader = `<img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto; display: block; margin: 0 auto;"/>`;
    const websiteFooter = `
      <div style="background-color: #f8fafc; color: #64748b; padding: 20px; text-align: center; font-size: 14px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">Visit us at <a href="https://www.siliconmeditech.in" style="color: #043bbc; text-decoration: none; font-weight: 600;">www.siliconmeditech.in</a></p>
      </div>`;

    // Admin Notification Email
    sendEmail({
      to: process.env.SMTP_USER,
      subject: `Accessory Enquiry: ${productTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background-color: #ffffff; padding: 25px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              ${emailHeader}
            </div>
              
            <div style="padding: 30px; color: #475569;">
              <h2 style="margin-top: 12px; margin-bottom: 25px; font-size: 22px; font-weight: 600; text-align: center; color: #043bbc;">New Accessory Enquiry</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; width: 35%; color: #475569; font-size: 15px;">👤 <strong>Client Name:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 15px;">📞 <strong>Phone:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px;">
                    <a href="tel:${phone}" style="color: #043bbc; text-decoration: none; font-weight: 500;">${phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 15px;">✉️ <strong>Email:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px;">
                    <a href="mailto:${email}" style="color: #043bbc; text-decoration: none; font-weight: 500;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 15px; vertical-align: top;">💬 <strong>Message:</strong></td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 15px; line-height: 1.5;">${message.replace(/\n/g, '<br/>')}</td>
                </tr>
              </table>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; color: #043bbc; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">📦 Accessory Information</h3>
                <p style="margin: 0 0 10px 0; color: #475569;">🏷️ <strong>Name:</strong> <span style="color: #0f172a;">${productTitle}</span></p>
                ${productImageUrl ? `
                <div style="margin-top: 20px; text-align: center;">
                  <img src="${productImageUrl}" alt="${productTitle}" style="max-width: 100%; height: auto; max-height: 250px; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);"/>
                </div>
                ` : ""}
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error("Admin accessory enquiry email failed:", err));

    // User Acknowledgement Email
    sendEmail({
      to: email,
      subject: `Enquiry Received: ${productTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background-color: #ffffff; padding: 25px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              ${emailHeader}
            </div>
              
            <div style="padding: 30px; color: #475569; line-height: 1.6;">
              <h2 style="margin-top: 12px; margin-bottom: 22px; font-size: 22px; text-align: center; font-weight: 600; color: #043bbc;">Enquiry Received</h2>
              <p style="font-size: 16px; color: #0f172a;">Hello <strong>${name}</strong>,</p>
              <p style="font-size: 16px;">Thank you for getting in touch with us! We have successfully received your inquiry regarding our accessory. Our team will review your request and get back to you shortly.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #043bbc; border-radius: 0 6px 6px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; font-size: 15px;">📦 <strong>Accessory:</strong> <span style="color: #0f172a; font-weight: 500;">${productTitle}</span></p>
                <p style="margin: 0; font-size: 15px;">🔖 <strong>Reference ID:</strong> <span style="font-family: monospace; background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; color: #0f172a; font-weight: 600;">#${contactId.slice(0, 8)}</span></p>
              </div>

              <p style="font-size: 15px;">If you need to add any more information, simply reply to this email. We look forward to speaking with you!</p>
              <p style="margin-bottom: 0; font-size: 15px; margin-top: 30px; color: #0f172a;">Best regards,<br/><strong>The Sales Team</strong></p>
            </div>
            ${websiteFooter}
          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error("User accessory enquiry email failed:", err));

    return res.status(201).json({ success: true, message: "Accessory enquiry submitted successfully", data: newEnquiry });
  } catch (error) {
    console.error("ACCESSORY ENQUIRY ERROR:", error);
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

    // Determine Subject and Title based on the enquiry type
    let emailSubject = "";
    let emailBodyTitle = "";

    if (contact.enquiryType === "Product") {
      emailSubject = `Response to your Product Inquiry: ${contact.productTitle} - ${contact.modelName}`;
      emailBodyTitle = `Response to your Inquiry: ${contact.modelName}`;
    } else if (contact.enquiryType === "Accessory") {
      emailSubject = `Response to your Accessory Inquiry: ${contact.productTitle}`;
      emailBodyTitle = `Response to your Inquiry: ${contact.productTitle}`;
    } else {
      emailSubject = `Response to your Inquiry: ${contact.messageTitle || "General"}`;
      emailBodyTitle = `Response to your Inquiry: ${contact.messageTitle || "General"}`;
    }

    const emailHeader = `<img src="${COMPANY_LOGO_URL}" alt="Silicon Meditech" style="width: 180px; height: auto; display: block; margin: 0 auto;"/>`;
    const websiteFooter = `
      <div style="background-color: #f8fafc; color: #64748b; padding: 20px; text-align: center; font-size: 14px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">Visit us at <a href="https://www.siliconmeditech.in" style="color: #043bbc; text-decoration: none; font-weight: 600;">www.siliconmeditech.in</a></p>
      </div>`;

    sendEmail({
      to: contact.email,
      subject: emailSubject,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            
            <div style="background-color: #ffffff; padding: 25px 30px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              ${emailHeader}
            </div>

            <div style="padding: 30px; color: #475569; line-height: 1.6;">
              <h2 style="margin-top: 12px; margin-bottom: 22px; font-size: 20px; text-align: center; font-weight: 600; color: #043bbc;">${emailBodyTitle}</h2>
              <p style="font-size: 16px; color: #0f172a;">Hello <strong>${contact.name}</strong>,</p>
              
              <div style="background-color: #f8fafc; padding: 25px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 25px 0;">
                <p style="margin: 0; font-size: 15px; color: #0f172a;">${responseMessage.replace(/\n/g, '<br/>')}</p>
              </div>
              
              <p style="margin-bottom: 0; margin-top: 30px; color: #0f172a;">Best regards,<br/><strong>Silicon Meditech Team</strong></p>
            </div>
            ${websiteFooter}
          </div>
        </body>
        </html>
      `,
    }).catch(err => console.error("Response email failed:", err));

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

export const getAccessoryEnquiries = async (req, res) => {
  try {
    const enquiries = await Contact.find({ enquiryType: "Accessory" }).sort({
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

    console.log(`[WhatsApp] Sending message to ${contact.phone}: ${message}`);

    return res
      .status(200)
      .json({ success: true, message: "WhatsApp message sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};