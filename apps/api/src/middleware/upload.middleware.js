import multer from "multer";

const storage = multer.memoryStorage();

export const receiptUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});
