import { Router } from "express";
import { askAi } from "../controllers/ai.controller.js";
import { guest, login, logout, me, register } from "../controllers/auth.controller.js";
import {
  dashboard,
  getEditableItems,
  getProduct,
  listProducts,
  priceLookup,
  purchases,
  updateEditableItem
} from "../controllers/analytics.controller.js";
import { uploadReceipt } from "../controllers/receipt.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { receiptUpload } from "../middleware/upload.middleware.js";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/guest", guest);
router.get("/auth/me", me);
router.post("/auth/logout", requireAuth, logout);

router.post("/upload-receipt", requireAuth, receiptUpload.single("file"), uploadReceipt);
router.get("/products", requireAuth, listProducts);
router.get("/products/:id", requireAuth, getProduct);
router.get("/price-lookup", requireAuth, priceLookup);
router.get("/dashboard", requireAuth, dashboard);
router.get("/purchases", requireAuth, purchases);
router.get("/data-items", requireAuth, getEditableItems);
router.patch("/purchase-items/:id", requireAuth, updateEditableItem);
router.post("/ai/ask", requireAuth, askAi);

export default router;
