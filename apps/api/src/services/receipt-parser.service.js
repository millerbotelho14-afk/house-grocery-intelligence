import { normalizeProductName } from "./normalization.service.js";

export async function parseReceipt(input) {
  if (looksLikeXml(input)) {
    return parseXmlReceipt(input);
  }

  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.some((line) => /DOCUMENTO AUXILIAR DA NOTA FISCAL DE CONSUMIDOR/i.test(line))) {
    return parseDanfeOcr(lines);
  }

  return parseGenericTextReceipt(lines);
}

function parseGenericTextReceipt(lines) {
  const itemLines = lines.filter((line) =>
    /(\d+[,.]?\d*)\s*(x|X)\s*(R?\$?\s*)?\d+[,.]\d{2}/.test(line)
  );

  const items = itemLines
    .map((line) => {
      const match =
        line.match(/^(.*?)[\s-]+(\d+[,.]?\d*)\s*(?:x|X)\s*(?:R?\$?\s*)?(\d+[,.]\d{2})$/i) ||
        line.match(/^(.*?)[\s-]+(\d+[,.]?\d*)\s+(?:R?\$?\s*)?(\d+[,.]\d{2})$/i);

      if (!match) return null;

      const namePart = cleanupName(match[1] || line);
      const quantity = toNumber(match[2] || "1");
      const unitPrice = toNumber(match[3] || "0,00");
      const normalized = normalizeProductName(namePart);

      return {
        originalName: namePart,
        normalizedProductName: normalized.normalizedProductName,
        quantity,
        unitPrice,
        totalPrice: Number((quantity * unitPrice).toFixed(2)),
        category: normalized.category
      };
    })
    .filter(Boolean);

  return {
    storeName: extractStoreName(lines),
    storeLocation: "Sao Paulo - SP",
    purchaseDate: extractDate(lines),
    totalValue: Number(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)),
    items
  };
}

function parseDanfeOcr(lines) {
  const normalizedLines = lines.map((line) => line.replace(/\s+/g, " ").trim());
  const items = [];
  const headerIndex = normalizedLines.findIndex((line) =>
    /DOCUMENTO AUXILIAR DA NOTA FISCAL DE CONSUMIDOR/i.test(line)
  );

  for (let index = 0; index < normalizedLines.length; index += 1) {
    const line = normalizedLines[index];
    const nextLine = normalizedLines[index + 1] || "";

    if (!line || !nextLine) continue;
    if (!/Qtde\.:/i.test(nextLine)) continue;
    if (isIgnoredDanfeLine(line)) continue;

    const quantityMatch = nextLine.match(/Qtde\.:([\d.,]+)/i);
    const numbers = [...nextLine.matchAll(/(\d+[.,]\d{1,2})/g)].map((match) => toNumber(match[1]));

    if (!quantityMatch || numbers.length < 2) continue;

    const quantity = toNumber(quantityMatch[1]);
    const unitPrice = numbers[numbers.length - 2];
    const totalPrice = numbers[numbers.length - 1];
    const originalName = cleanupName(line.replace(/\(Código:.*$/i, "").trim());
    const normalized = normalizeProductName(originalName);

    items.push({
      originalName,
      normalizedProductName: normalized.normalizedProductName,
      quantity,
      unitPrice,
      totalPrice,
      category: normalized.category
    });
  }

  return {
    storeName: cleanupStoreName(extractDanfeStoreName(normalizedLines, headerIndex)),
    storeLocation: normalizedLines.slice(2, 5).find((line) => /SP|RJ|MG|PR|SC|RS/i.test(line)) || "Brasil",
    purchaseDate: extractDanfeDate(normalizedLines),
    totalValue: extractDanfeTotal(normalizedLines) || Number(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)),
    items
  };
}

function parseXmlReceipt(xml) {
  const itemBlocks = [...xml.matchAll(/<det[\s\S]*?<\/det>/gim)].map((match) => match[0]);

  const items = itemBlocks.map((block) => {
    const originalName = readTag(block, "xProd") || "Produto";
    const quantity = toNumber(readTag(block, "qCom") || "1");
    const unitPrice = toNumber(readTag(block, "vUnCom") || "0");
    const totalPrice = toNumber(readTag(block, "vProd") || String(quantity * unitPrice));
    const normalized = normalizeProductName(originalName);

    return {
      originalName,
      normalizedProductName: normalized.normalizedProductName,
      quantity,
      unitPrice,
      totalPrice,
      category: normalized.category
    };
  });

  return {
    storeName: readTag(xml, "xFant") || readTag(xml, "xNome") || "Cupom XML",
    storeLocation: [readTag(xml, "xMun"), readTag(xml, "UF")].filter(Boolean).join(" - ") || "Brasil",
    purchaseDate: (readTag(xml, "dhEmi") || readTag(xml, "dEmi") || new Date().toISOString()).slice(0, 10),
    totalValue: toNumber(readTag(xml, "vNF") || String(items.reduce((sum, item) => sum + item.totalPrice, 0))),
    items
  };
}

function isIgnoredDanfeLine(line) {
  return /DOCUMENTO AUXILIAR|Valor total|Valor a pagar|Forma de pagamento|Informa|Consumidor|Chave de acesso|Protocolo|Qtd\. total/i.test(line);
}

function looksLikeXml(input) {
  return typeof input === "string" && input.includes("<") && input.includes(">");
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>(.*?)</${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

function extractStoreName(lines) {
  return (
    lines.find((line) => /mercado|supermercado|atacad|nfc-e|pao de acucar|assai|sam/i.test(line)) ||
    "Cupom Importado"
  );
}

function extractDate(lines) {
  const line = lines.find((entry) => /\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(entry));
  if (!line) {
    return new Date().toISOString().slice(0, 10);
  }

  const date = line.match(/\d{4}-\d{2}-\d{2}/)?.[0] || line.match(/\d{2}\/\d{2}\/\d{4}/)?.[0];
  return normalizeDate(date);
}

function extractDanfeDate(lines) {
  const emissionLine = lines.find((line) => /Emiss[aã]o:/i.test(line));
  if (emissionLine) {
    const match = emissionLine.match(/\d{2}\/\d{2}\/\d{4}/);
    if (match) {
      return normalizeDate(match[0]);
    }
  }

  return extractDate(lines);
}

function extractDanfeTotal(lines) {
  const totalLine = lines.find((line) => /Valor a pagar R\$:|Valor total R\$/i.test(line));
  if (!totalLine) return 0;

  const values = [...totalLine.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2})/g)].map((match) =>
    toNumber(match[1])
  );
  return values.at(-1) || 0;
}

function extractDanfeStoreName(lines, headerIndex) {
  const start = Math.max(headerIndex + 1, 0);
  const candidates = lines.slice(start, start + 8);
  return (
    candidates.find((line) => /LTDA|ME|EIRELI|SUPERMERCAD|COMERCIO|ATACAD/i.test(line)) ||
    candidates.find((line) => line.length > 8 && !/CNPJ|DOCUMENTO AUXILIAR|ELETRÔNICA|\d{2}\/\d{2}\/\d{4}/i.test(line)) ||
    extractStoreName(lines)
  );
}

function normalizeDate(date) {
  if (!date) {
    return new Date().toISOString().slice(0, 10);
  }

  if (date.includes("/")) {
    const [day, month, year] = date.split("/");
    return `${year}-${month}-${day}`;
  }

  return date;
}

function cleanupName(value) {
  return value.replace(/\s+/g, " ").replace(/[^\w\s./,-]/g, " ").trim();
}

function cleanupStoreName(value) {
  return value.replace(/^[^A-Za-z]+/, "").replace(/\s+/g, " ").trim();
}

function toNumber(value) {
  const input = String(value).replace(/[^\d,.-]/g, "");

  if (input.includes(",") && input.includes(".")) {
    return Number(input.replace(/\./g, "").replace(",", "."));
  }

  if (input.includes(",")) {
    return Number(input.replace(",", "."));
  }

  return Number(input);
}
