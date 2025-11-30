import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  try {
    console.log(`[Auth Middleware] ${req.method} ${req.path} - Checking auth`);
    const header = req.headers.authorization;

    if (!header) {
      console.log("[Auth Middleware] Missing authorization header");
      return res.status(401).json({ error: "Missing token" });
    }

    const token = header.split(" ")[1];
    if (!token) {
      console.log("[Auth Middleware] Token not found in header");
      return res.status(401).json({ error: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[Auth Middleware] Token verified successfully for user:", decoded.user_id);

    req.user = decoded; // contains user_id, email

    next();
  } catch (err) {
    console.error("[Auth Middleware] Auth error:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}
