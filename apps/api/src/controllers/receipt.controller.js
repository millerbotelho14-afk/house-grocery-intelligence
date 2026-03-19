import { extractReceiptText } from "../services/ocr.service.js";
import { normalizeReceiptDraft, buildReceiptWarnings } from "../services/receipt-draft.service.js";
import { parseReceipt } from "../services/receipt-parser.service.js";
import { saveParsedReceipt } from "../services/repository.service.js";

export async function previewReceipt(req, res) {
  const { type, source } = req.body || {};
  const file = req.file || null;

  if (!type && !file) {
    return res.status(400).json({ message: "Envie um tipo, link, conteudo ou arquivo" });
  }

  const text = await extractReceiptText({ type, source, file });
  const parsedReceipt = normalizeReceiptDraft(await parseReceipt(text));
  const warnings = buildReceiptWarnings(parsedReceipt);

  return res.status(200).json({
    message: "Cupom lido. Revise antes de salvar.",
    parsedReceipt,
    warnings
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
