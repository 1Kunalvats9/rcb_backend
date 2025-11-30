import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();

// Support multiple client IDs (comma-separated in env var)
// Example: GOOGLE_CLIENT_ID="ios-client-id,web-client-id,android-client-id"
// This allows iOS, Android, and Web clients to use different client IDs
const getClientIds = () => {
  const clientIdEnv = process.env.GOOGLE_CLIENT_ID || '';
  if (!clientIdEnv) return [];
  
  if (clientIdEnv.includes(',')) {
    return clientIdEnv.split(',').map(id => id.trim()).filter(Boolean);
  }
  return [clientIdEnv];
};

router.post("/google", async (req, res) => {
  try {
    const { id_token, client_id } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: "Missing id_token" });
    }

    // 1. Verify Google Token
    // Get all configured client IDs from environment
    const configuredClientIds = getClientIds();
    let audience;
    if (client_id) {
      audience = [...new Set([client_id, ...configuredClientIds])];
    } else if (configuredClientIds.length > 0) {
      audience = configuredClientIds.length === 1 ? configuredClientIds[0] : configuredClientIds;
    } else {
      return res.status(500).json({ error: "Google Client ID not configured" });
    }

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: audience
    });
    
    const payload = ticket.getPayload();

    const { sub, email, name, picture } = payload;

    // 2. Check / Create user in DB
    let user = await User.findOne({ google_id: sub });

    if (!user) {
      user = await User.create({
        google_id: sub,
        email,
        name,
        picture
      });
    }

    // 3. Create JWT for this user
    const token = jwt.sign(
      {
        user_id: user._id.toString(),
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // 4. Send everything needed to the app
    return res.json({
      success: true,
      user_id: user._id.toString(),
      token,
      email: user.email,
      name: user.name,
      picture: user.picture
    });

  } catch (err) {
    console.error("Google Auth Error:", err);
    
    // Provide more specific error messages
    if (err.message && err.message.includes("Wrong recipient")) {
      return res.status(401).json({ 
        error: "Invalid token: Client ID mismatch. Make sure your iOS client ID is added to GOOGLE_CLIENT_ID environment variable (comma-separated)." 
      });
    }
    
    res.status(500).json({ error: "Auth failed", details: err.message });
  }
});

export default router;
