// middleware/upload.middleware.js — multer image upload config
import multer from "multer";
import path   from "path";
import fs     from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../public/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename:    (_req, file, cb) => {
    const ext    = path.extname(file.originalname).toLowerCase();
    const name   = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

// ── Image-only filter (profile photos, gig covers, etc.) ─────────────────────
const imageFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), false);
};

export const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Message-attachment filter (images + common docs) ─────────────────────────
const MESSAGE_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

const messageFilter = (_req, file, cb) => {
  if (MESSAGE_TYPES.has(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type"), false);
};

export const messageUpload = multer({
  storage,
  fileFilter: messageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB for chat attachments
});
