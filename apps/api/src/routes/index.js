import { Router } from "express";
import { askAi } from "../controllers/ai.controller.js";
import { guest, login, logout, me, register } from "../controllers/auth.controller.js";
import {
  dashboard,
  getEditableItems,
  getProduct,
  listProducts,
  purchases,
  priceLookup,
  updateEditableItem
} from "../controllers/analytics.controller.js";
import { createPurchase, previewReceipt } from "../controllers/receipt.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { receiptUpload } from "../middleware/upload.middleware.js";

const router = Router();
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

router.post("/auth/register", asyncHandler(register));
router.post("/auth/login", asyncHandler(login));
router.post("/auth/guest", asyncHandler(guest));
router.get("/auth/me", asyncHandler(me));
router.post("/auth/logout", requireAuth, asyncHandler(logout));

router.post("/upload-receipt", requireAuth, receiptUpload.single("file"), asyncHandler(previewReceipt));
router.post("/purchases", requireAuth, asyncHandler(createPurchase));
router.get("/products", requireAuth, asyncHandler(listProducts));
router.get("/products/:id", requireAuth, asyncHandler(getProduct));
router.get("/price-lookup", requireAuth, asyncHandler(priceLookup));
router.get("/dashboard", requireAuth, asyncHandler(dashboard));
router.get("/purchases", requireAuth, asyncHandler(purchases));
router.get("/data-items", requireAuth, asyncHandler(getEditableItems));
router.patch("/purchase-items/:id", requireAuth, asyncHandler(updateEditableItem));
router.post("/ai/ask", requireAuth, asyncHandler(askAi));

export default router;
