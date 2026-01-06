import { OAuth2Client } from "google-auth-library";
const GOOGLE_CLIENT_ID = "349309195310-ee43pba87mk2i0kvc0a5sj173rossika.apps.googleusercontent.com"
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
export async function verifyGoogleToken(idToken) {
  if (!idToken) throw new Error("No token provided");

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid token: no payload");

    // payload contains email, name, picture, email_verified
    return payload;
  } catch (err) {
    console.error("Google token verification failed:", err);
    throw new Error("Invalid Google token");
  }
}

