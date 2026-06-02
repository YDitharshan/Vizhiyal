// services/uploadApi.js
import api from "../lib/axios.js";

// Axios sets "Content-Type: application/json" globally.
// For multipart uploads we must clear it so the browser can inject
// "multipart/form-data; boundary=..." automatically — otherwise multer
// can't parse the request body and returns 400.
const multipartHeaders = { "Content-Type": undefined };

export const uploadApi = {
  // Upload a profile/gig image (images only, 5 MB limit)
  uploadImage: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/upload", form, { headers: multipartHeaders });
  },

  // Upload a chat attachment — images or documents (10 MB limit)
  // Returns { url, name, isImage }
  uploadMessageFile: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/upload/message", form, { headers: multipartHeaders });
  },
};
