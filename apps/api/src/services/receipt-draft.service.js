import { normalizeProductName } from "./normalization.service.js";

export function createBlankReceiptDraft() {
  return {
    storeName: "Compra avulsa",
    storeLocation: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    totalValue: 0,
    items: [createBlankReceiptItem()]
  };
}

export function normalizeReceiptDraft(input = {}) {
  const sourceItems = Array.isArray(input.items) ? input.items : [];
  const items = sourceItems
    .map((item, index) => normalizeReceiptItem(item, index))
    .filter((item) => item.originalName || item.totalPrice > 0 || item.quantity > 0);

  const totalFromItems = roundMoney(items.reduce((sum, item) => sum + item.totalPrice, 0));
  const totalValue = normalizeMoney(input.totalValue) || totalFromItems;

  return {
    storeName: cleanText(input.storeName) || "Compra importada",
    storeLocation: cleanText(input.storeLocation),
    purchaseDate: normalizeDateInput(input.purchaseDate),
    totalValue,
    items
  };
}

export function buildReceiptWarnings(draft) {
  const warnings = [];
  const zeroValueItems = draft.items.filter((item) => item.totalPrice <= 0 || item.unitPrice <= 0);
  const totalFromItems = roundMoney(draft.items.reduce((sum, item) => sum + item.totalPrice, 0));
  const totalGap = Math.abs(roundMoney(draft.totalValue) - totalFromItems);

  if (!draft.items.length) {
    warnings.push("Nenhum item foi identificado automaticamente.");
  }

  if (draft.totalValue <= 0) {
    warnings.push("O total da compra esta zerado e precisa de revisao.");
  }

  if (zeroValueItems.length) {
    warnings.push(`${zeroValueItems.length} item(ns) estao com preco zerado ou incompleto.`);
  }

  if (!draft.storeName || draft.storeName === "Compra importada") {
    warnings.push("A loja nao foi identificada com confianca.");
  }

  if (draft.items.length && totalGap > 0.09) {
    warnings.push("O total da compra nao bate com a soma dos itens. Vale revisar antes de salvar.");
  }

  return warnings;
}

export function createBlankReceiptItem() {
  return {
    originalName: "",
    normalizedProductName: "",
    category: "Outros",
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
    userComment: ""
  };
}

function normalizeReceiptItem(item = {}, index = 0) {
  const fallbackName = cleanText(item.originalName || item.normalizedProductName) || `Item ${index + 1}`;
  const normalized = normalizeProductName(fallbackName);
  const quantity = normalizePositiveNumber(item.quantity, 1);
  let unitPrice = normalizeMoney(item.unitPrice);
  let totalPrice = normalizeMoney(item.totalPrice);

  if (!unitPrice && totalPrice && quantity) {
    unitPrice = roundMoney(totalPrice / quantity);
  }

  if (!totalPrice && unitPrice && quantity) {
    totalPrice = roundMoney(unitPrice * quantity);
  }

  return {
    originalName: cleanText(item.originalName) || fallbackName,
    normalizedProductName: cleanText(item.normalizedProductName) || normalized.normalizedProductName,
    category: cleanText(item.category) || normalized.category || "Outros",
    quantity,
    unitPrice,
    totalPrice,
    userComment: cleanText(item.userComment)
  };
}

function normalizeDateInput(value) {
  const input = String(value || "").trim();

  if (!input) {
    return new Date().toISOString().slice(0, 10);
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [day, month, year] = input.split("/");
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizePositiveNumber(value, fallback) {
  const number = normalizeMoney(value);
  return number > 0 ? number : fallback;
}

function normalizeMoney(value) {
  const input = String(value ?? "")
    .replace(/[^\d,.-]/g, "")
    .trim();

  if (!input) {
    return 0;
  }

  if (input.includes(",") && input.includes(".")) {
    return roundMoney(Number(input.replace(/\./g, "").replace(",", ".")));
  }

  if (input.includes(",")) {
    return roundMoney(Number(input.replace(",", ".")));
  }

  return roundMoney(Number(input));
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function roundMoney(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Number(value.toFixed(2));
}
