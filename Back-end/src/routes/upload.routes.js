// routes/upload.routes.js — POST /api/upload (authenticated)
import { Router } from "express";
import { protect }        from "../middleware/auth.middleware.js";
import { upload, messageUpload } from "../middleware/upload.middleware.js";

const router = Router();

// POST /api/upload  — upload a single image file, returns { url }
router.post(
  "/",
  protect,
  upload.single("file"),
  (req, res) => {
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file uploaded" });

    // Return the relative URL; frontend prepends the API base URL when displaying
    const url = `/uploads/${req.file.filename}`;
    return res.json({ success: true, url });
  },
);

// POST /api/upload/message — upload an image or document for chat, returns { url, name, isImage }
router.post(
  "/message",
  protect,
  messageUpload.single("file"),
  (req, res) => {
    if (!req.file)
      return res.status(400).json({ success: false, message: "No file uploaded" });

    const url     = `/uploads/${req.file.filename}`;
    const isImage = req.file.mimetype.startsWith("image/");
    return res.json({
      success: true,
      url,
      name:    req.file.originalname,
      isImage,
    });
  },
);

// Global multer error handler for this router
router.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ success: false, message: "File too large. Maximum size is 5 MB." });
  return res.status(400).json({ success: false, message: err.message || "Upload failed" });
});

export default router;
