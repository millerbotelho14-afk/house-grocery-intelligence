import { env } from "../config/env.js";
import { extractReceiptText } from "./ocr.service.js";
import { buildReceiptWarnings, normalizeReceiptDraft } from "./receipt-draft.service.js";
import { parseReceipt } from "./receipt-parser.service.js";

const RECEIPT_PROMPT = [
  "Voce recebe um cupom fiscal brasileiro em PDF, imagem ou texto.",
  "Extraia somente os dados realmente presentes no documento.",
  "Retorne todos os itens individualmente, sem inventar produtos.",
  "Use portugues do Brasil.",
  "O campo normalizedProductName deve ser um nome padrao e limpo do produto.",
  "Escolha category entre: Mercearia, Laticinios, Carnes, Hortifruti, Bebidas, Higiene, Limpeza, Padaria, Farmacia, Pet, Congelados, Outros.",
  "purchaseDate deve vir em YYYY-MM-DD quando for identificavel. Se nao achar, deixe string vazia.",
  "storeLocation deve conter cidade/UF ou um trecho curto do endereco, se aparecer no documento.",
  "quantity, unitPrice e totalPrice devem ser numericos.",
  "Nao transforme totais, descontos, impostos ou forma de pagamento em itens.",
  "Quando houver duvida, preserve o texto mais fiel do item no campo originalName."
].join(" ");

const RECEIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["storeName", "storeLocation", "purchaseDate", "totalValue", "summary", "items"],
  properties: {
    storeName: { type: "string" },
    storeLocation: { type: "string" },
    purchaseDate: { type: "string" },
    totalValue: { type: "number" },
    summary: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "originalName",
          "normalizedProductName",
          "category",
          "quantity",
          "unitPrice",
          "totalPrice",
          "userComment"
        ],
        properties: {
          originalName: { type: "string" },
          normalizedProductName: { type: "string" },
          category: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          totalPrice: { type: "number" },
          userComment: { type: "string" }
        }
      }
    }
  }
};

export async function previewReceiptFromSource({ type = "", source = "", file = null }) {
  const normalizedType = resolveInputType(type, file);
  validateReceiptInput(normalizedType, source, file);

  const fallbackWarnings = [];

  if (shouldUseOpenAi(normalizedType, file)) {
    try {
      const aiDraft = await extractReceiptWithOpenAi({ type: normalizedType, source, file });
      const parsedReceipt = normalizeReceiptDraft(aiDraft);

      if (!parsedReceipt.items.length || parsedReceipt.totalValue <= 0) {
        throw new Error("A resposta da IA veio incompleta para este cupom.");
      }

      return {
        provider: "openai",
        parsedReceipt,
        warnings: buildReceiptWarnings(parsedReceipt),
        extractionSummary: cleanText(aiDraft.summary)
      };
    } catch (error) {
      fallbackWarnings.push(
        "A leitura por IA nao ficou disponivel nesta tentativa. O sistema usou o parser local como fallback."
      );
      console.error("OpenAI receipt extraction failed:", error);
    }
  } else if (["pdf", "image"].includes(normalizedType) && !env.openAiApiKey) {
    fallbackWarnings.push(
      "OPENAI_API_KEY nao configurada. O parser local foi usado, mas PDFs e imagens ficam mais confiaveis com a leitura via OpenAI."
    );
  }

  const text = await extractReceiptText({ type: normalizedType, source, file });
  const parsedReceipt = normalizeReceiptDraft(await parseReceipt(text));

  return {
    provider: "local",
    parsedReceipt,
    warnings: [...fallbackWarnings, ...buildReceiptWarnings(parsedReceipt)],
    extractionSummary: ""
  };
}

function shouldUseOpenAi(type, file) {
  if (!env.openAiApiKey) {
    return false;
  }

  return Boolean(file) && ["pdf", "image"].includes(type);
}

async function extractReceiptWithOpenAi({ type, file }) {
  const model = resolveReceiptModel(type);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model,
      max_output_tokens: 4000,
      instructions: RECEIPT_PROMPT,
      text: {
        format: {
          type: "json_schema",
          name: "receipt_extraction",
          description: "Estrutura padrao para compras extraidas de cupons fiscais.",
          strict: true,
          schema: RECEIPT_SCHEMA
        }
      },
      input: [
        {
          role: "user",
          content: [
            createOpenAiFilePart(type, file),
            {
              type: "input_text",
              text: "Leia este cupom e devolva os dados estruturados da compra."
            }
          ]
        }
      ]
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || "Falha ao extrair o cupom com OpenAI.");
  }

  const rawText = data.output_text || getResponseText(data);
  if (!rawText) {
    throw new Error("A OpenAI nao retornou um JSON utilizavel para o cupom.");
  }

  try {
    return JSON.parse(rawText);
  } catch (_error) {
    throw new Error("A resposta estruturada da OpenAI veio em formato inesperado.");
  }
}

function createOpenAiFilePart(type, file) {
  const filename = file?.originalname || (type === "image" ? "receipt.jpg" : "receipt.pdf");
  const mimeType = normalizeMimeType(type, file?.mimetype || "");
  const base64 = file.buffer.toString("base64");

  if (type === "image") {
    return {
      type: "input_image",
      image_url: `data:${mimeType};base64,${base64}`,
      detail: "high"
    };
  }

  return {
    type: "input_file",
    filename,
    file_data: `data:${mimeType};base64,${base64}`
  };
}

function getResponseText(data) {
  const chunks = [];
  for (const output of data.output || []) {
    for (const content of output.content || []) {
      if (content.type === "output_text" && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function validateReceiptInput(type, source, file) {
  const trimmedSource = String(source || "").trim();

  if (file) {
    return;
  }

  if (["pdf", "image"].includes(type)) {
    throw new Error("Envie um arquivo PDF ou imagem para continuar.");
  }

  if (!trimmedSource) {
    throw new Error("Envie um arquivo ou cole o conteudo do cupom.");
  }
}

function resolveInputType(type, file) {
  const sourceType = String(type || "").trim().toLowerCase();

  if (sourceType) {
    return sourceType;
  }

  if (!file) {
    return "";
  }

  const name = String(file.originalname || "").toLowerCase();
  const mime = String(file.mimetype || "").toLowerCase();

  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  if (mime.includes("xml") || name.endsWith(".xml")) return "xml";
  if (mime.startsWith("image/")) return "image";

  return "";
}

function normalizeMimeType(type, mimeType) {
  if (mimeType) {
    return mimeType;
  }

  if (type === "image") {
    return "image/jpeg";
  }

  return "application/pdf";
}

function resolveReceiptModel(type) {
  const configured = String(env.openAiReceiptModel || "").trim() || "gpt-4o-mini";

  if (["pdf", "image"].includes(type) && !supportsFileInputs(configured)) {
    return "gpt-4o-mini";
  }

  return configured;
}

function supportsFileInputs(model) {
  const normalized = String(model || "").toLowerCase();
  return normalized.startsWith("gpt-4o") || normalized.startsWith("o1");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
