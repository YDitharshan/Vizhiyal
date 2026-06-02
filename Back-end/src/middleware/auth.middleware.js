// middleware/auth.middleware.js
// protect   — verifies JWT, attaches req.user
// authorize — role-based gate  e.g. authorize("admin", "superadmin")
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

// ── protect: require valid JWT ────────────────────────────────
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not authorised, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account has been suspended" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

// ── authorize: restrict to certain roles ─────────────────────
// Usage: router.delete("/...", protect, authorize("admin", "superadmin"), handler)
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not permitted to access this route`,
      });
    }
    next();
  };
};
