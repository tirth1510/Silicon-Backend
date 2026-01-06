import validator from "validator";
import dns from "dns/promises";

export const validateEmailGlobally = async (email) => {
  // 1. Syntax check
  if (!validator.isEmail(email)) {
    return { valid: false, reason: "Invalid email format" };
  }

  // 2. Domain + MX record check
  const domain = email.split("@")[1];

  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) {
      return { valid: false, reason: "Email domain cannot receive emails" };
    }
  } catch {
    return { valid: false, reason: "Email domain does not exist" };
  }

  return { valid: true };
};
