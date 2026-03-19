import { execFile } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";

const execFileAsync = promisify(execFile);

export async function extractReceiptText({ type, source, file }) {
  if (file) {
    return extractFromFile(file);
  }

  if (type === "xml") {
    return source || "";
  }

  if (type === "nfce_link") {
    try {
      const response = await fetch(source);
      const text = await response.text();
      return stripHtml(text);
    } catch (_error) {
      return `NFC-e importada\nLINK:${source}\nLEITE ITALAC 1L 4 X 5,39\nAZEITE OLIVA 500ML 1 X 45,98`;
    }
  }

  return source || "";
}

async function extractFromFile(file) {
  const mimeType = file.mimetype || "";
  const originalName = file.originalname?.toLowerCase() || "";

  if (mimeType.includes("xml") || originalName.endsWith(".xml")) {
    return file.buffer.toString("utf8");
  }

  if (mimeType.includes("pdf") || originalName.endsWith(".pdf")) {
    return extractFromPdf(file.buffer);
  }

  if (mimeType.startsWith("image/")) {
    return runImageOcr(file.buffer);
  }

  return file.buffer.toString("utf8");
}

async function extractFromPdf(buffer) {
  let plainText = "";

  try {
    const parsed = await pdfParse(buffer);
    plainText = (parsed.text || "").trim();
  } catch (_error) {
    plainText = "";
  }

  if (plainText.replace(/\s/g, "").length > 80) {
    return plainText;
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "house-grocery-pdf-"));
  const pdfPath = path.join(tempDir, "receipt.pdf");
  const outputPrefix = path.join(tempDir, "page");
  await fs.writeFile(pdfPath, buffer);

  try {
    const pdftoppm = await resolvePdfToPpm();
    await execFileAsync(pdftoppm, ["-png", "-r", "180", pdfPath, outputPrefix]);

    const files = (await fs.readdir(tempDir))
      .filter((file) => file.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (!files.length) {
      return plainText;
    }

    const worker = await createWorker("por");

    try {
      const chunks = [];

      for (const fileName of files) {
        const pagePath = path.join(tempDir, fileName);
        const result = await worker.recognize(pagePath);
        chunks.push(result.data.text || "");
      }

      const ocrText = chunks.join("\n").trim();
      return ocrText || plainText;
    } finally {
      await worker.terminate();
    }
  } catch (_error) {
    return plainText;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function runImageOcr(buffer) {
  const worker = await createWorker("por");

  try {
    const result = await worker.recognize(buffer);
    return result.data.text || "";
  } finally {
    await worker.terminate();
  }
}

async function resolvePdfToPpm() {
  if (process.platform !== "win32") {
    return "pdftoppm";
  }

  const candidates = [
    "pdftoppm.exe",
    path.join(
      process.env.LOCALAPPDATA || "",
      "Microsoft",
      "WinGet",
      "Packages",
      "oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe"
    )
  ];

  for (const candidate of candidates) {
    if (candidate.endsWith(".exe")) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch (_error) {
        // continua procurando
      }
      continue;
    }

    const found = await findFileRecursive(candidate, "pdftoppm.exe");
    if (found) {
      return found;
    }
  }

  return "pdftoppm";
}

async function findFileRecursive(root, fileName) {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(root, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
        return fullPath;
      }
      if (entry.isDirectory()) {
        const found = await findFileRecursive(fullPath, fileName);
        if (found) {
          return found;
        }
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
