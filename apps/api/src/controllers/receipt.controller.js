import { extractReceiptText } from "../services/ocr.service.js";
import { parseReceipt } from "../services/receipt-parser.service.js";
import { saveParsedReceipt } from "../services/repository.service.js";

export async function uploadReceipt(req, res) {
  const { type, source } = req.body || {};
  const file = req.file || null;

  if (!type && !file) {
    return res.status(400).json({ message: "Envie um tipo, link, conteudo ou arquivo" });
  }

  const text = await extractReceiptText({ type, source, file });
  const parsedReceipt = await parseReceipt(text);
  const saved = await saveParsedReceipt(parsedReceipt, req.user.id);

  return res.status(201).json({
    message: "Cupom processado com sucesso",
    parsedReceipt,
    saved
  });
}
