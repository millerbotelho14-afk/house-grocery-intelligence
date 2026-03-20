import { normalizeReceiptDraft } from "../services/receipt-draft.service.js";
import { previewReceiptFromSource } from "../services/receipt-intelligence.service.js";
import { saveParsedReceipt } from "../services/repository.service.js";

export async function previewReceipt(req, res) {
  const { type, source } = req.body || {};
  const file = req.file || null;

  const preview = await previewReceiptFromSource({ type, source, file });

  return res.status(200).json({
    message: "Cupom lido. Revise antes de salvar.",
    provider: preview.provider,
    extractionSummary: preview.extractionSummary,
    parsedReceipt: preview.parsedReceipt,
    warnings: preview.warnings
  });
}

export async function createPurchase(req, res) {
  const parsedReceipt = normalizeReceiptDraft(req.body?.parsedReceipt || req.body || {});

  if (!parsedReceipt.items.length) {
    return res.status(400).json({ message: "Adicione pelo menos um item antes de salvar." });
  }

  const saved = await saveParsedReceipt(parsedReceipt, req.user.id);

  return res.status(201).json({
    message: "Compra salva com sucesso",
    parsedReceipt,
    saved
  });
}
