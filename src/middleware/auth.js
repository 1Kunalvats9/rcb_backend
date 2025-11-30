import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // contains user_id, email

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
