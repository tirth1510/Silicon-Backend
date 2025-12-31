import { Contact } from "../models/contact.model.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid"; // import uuid

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
    });

    // Telegram notification
    let textMessage = `
💬 *New Contact Message* (${contactId})
--------------------------------
*Name:* ${name}
*Email:* ${email}
*Phone:* ${phone}
${companyName ? `*Company:* ${companyName}` : ""}
${companyEmail ? `*Company Email:* ${companyEmail}` : ""}
${companyPhoneNumber ? `*Company Phone:* ${companyPhoneNumber}` : ""}
${companyLocation ? `*Location:* ${companyLocation}` : ""}
${messageTitle ? `*Title:* ${messageTitle}` : ""}

*Message:*  
${message}
    `;

    await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: textMessage.trim(),
        parse_mode: "Markdown",
      }
    );

    return res.status(201).json({
      success: true,
      message: "Contact saved and notification sent",
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
