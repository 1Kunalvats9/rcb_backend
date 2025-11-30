import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: "Missing id_token" });
    }

    // 1. Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
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
    res.status(500).json({ error: "Auth failed" });
  }
});

export default router;
