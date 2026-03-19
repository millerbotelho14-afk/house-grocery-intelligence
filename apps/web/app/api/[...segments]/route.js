import { NextResponse } from "next/server";
import { answerQuestion } from "../../../../api/src/services/ai.service.js";
import {
  getDashboard,
  getEditableItems,
  getPriceLookup,
  getProductById,
  getProducts,
  getPurchases,
  updateEditableItem
} from "../../../../api/src/services/analytics.service.js";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByEmail,
  getUserFromToken,
  saveParsedReceipt
} from "../../../../api/src/services/repository.service.js";
import { extractReceiptText } from "../../../../api/src/services/ocr.service.js";
import { parseReceipt } from "../../../../api/src/services/receipt-parser.service.js";
import { comparePassword, generateSessionToken, hashPassword } from "../../../../api/src/utils/auth.js";

export const runtime = "nodejs";

export async function GET(request, context) {
  return handleRequest(request, context);
}

export async function POST(request, context) {
  return handleRequest(request, context);
}

export async function PATCH(request, context) {
  return handleRequest(request, context);
}

async function handleRequest(request, context) {
  const segments = context.params.segments || [];
  const [resource, identifier, extra] = segments;

  try {
    if (resource === "auth" && identifier === "me" && request.method === "GET") {
      const user = await requireUser(request);
      return NextResponse.json({ user: sanitizeUser(user) });
    }

    if (resource === "auth" && identifier === "register" && request.method === "POST") {
      const payload = await request.json();
      if (!payload.email || !payload.password) {
        return NextResponse.json({ message: "Email e senha sao obrigatorios" }, { status: 400 });
      }

      const existing = await findUserByEmail(payload.email);
      if (existing) {
        return NextResponse.json({ message: "Ja existe uma conta com esse email" }, { status: 409 });
      }

      const passwordHash = await hashPassword(payload.password);
      const user = await createUser({
        email: payload.email,
        passwordHash,
        fullName: payload.fullName || payload.email.split("@")[0]
      });

      const token = generateSessionToken();
      await createSession(user.id, token);
      return NextResponse.json({ token, user });
    }

    if (resource === "auth" && identifier === "login" && request.method === "POST") {
      const payload = await request.json();
      const user = await findUserByEmail(payload.email || "");
      if (!user) {
        return NextResponse.json({ message: "Credenciais invalidas" }, { status: 401 });
      }

      const valid = await comparePassword(payload.password || "", user.password);
      if (!valid) {
        return NextResponse.json({ message: "Credenciais invalidas" }, { status: 401 });
      }

      const token = generateSessionToken();
      await createSession(user.id, token);
      return NextResponse.json({ token, user: sanitizeUser(user) });
    }

    if (resource === "auth" && identifier === "logout" && request.method === "POST") {
      const token = getToken(request);
      if (token) {
        await deleteSession(token);
      }
      return NextResponse.json({ message: "Logout realizado" });
    }

    const user = await requireUser(request);

    if (resource === "dashboard" && request.method === "GET") {
      return NextResponse.json(await getDashboard(user.id));
    }

    if (resource === "purchases" && request.method === "GET") {
      return NextResponse.json(await getPurchases(user.id));
    }

    if (resource === "products" && !identifier && request.method === "GET") {
      const query = new URL(request.url).searchParams.get("q") || "";
      return NextResponse.json(await getProducts(user.id, query));
    }

    if (resource === "products" && identifier && request.method === "GET") {
      const product = await getProductById(user.id, identifier);
      if (!product) {
        return NextResponse.json({ message: "Produto nao encontrado" }, { status: 404 });
      }
      return NextResponse.json(product);
    }

    if (resource === "price-lookup" && request.method === "GET") {
      const query = new URL(request.url).searchParams.get("q") || "";
      const result = await getPriceLookup(user.id, query);
      if (!result) {
        return NextResponse.json({ message: "Nenhum produto encontrado" }, { status: 404 });
      }
      return NextResponse.json(result);
    }

    if (resource === "data-items" && request.method === "GET") {
      return NextResponse.json(await getEditableItems(user.id));
    }

    if (resource === "purchase-items" && identifier && request.method === "PATCH") {
      const payload = await request.json();
      const item = await updateEditableItem(user.id, identifier, payload || {});
      if (!item) {
        return NextResponse.json({ message: "Item nao encontrado" }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    if (resource === "ai" && identifier === "ask" && request.method === "POST") {
      const payload = await request.json();
      if (!payload.question) {
        return NextResponse.json({ message: "Pergunta obrigatoria" }, { status: 400 });
      }
      return NextResponse.json(await answerQuestion(user.id, payload.question));
    }

    if (resource === "upload-receipt" && request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      let type = "";
      let source = "";
      let file = null;

      if (contentType.includes("multipart/form-data")) {
        const form = await request.formData();
        type = String(form.get("type") || "");
        source = String(form.get("source") || "");
        const uploaded = form.get("file");
        if (uploaded && typeof uploaded === "object" && "arrayBuffer" in uploaded) {
          file = {
            originalname: uploaded.name,
            mimetype: uploaded.type,
            buffer: Buffer.from(await uploaded.arrayBuffer())
          };
        }
      } else {
        const payload = await request.json();
        type = payload.type || "";
        source = payload.source || "";
      }

      if (!type && !file) {
        return NextResponse.json({ message: "Envie um tipo, link, conteudo ou arquivo" }, { status: 400 });
      }

      const text = await extractReceiptText({ type, source, file });
      const parsedReceipt = await parseReceipt(text);
      const saved = await saveParsedReceipt(parsedReceipt, user.id);

      return NextResponse.json(
        {
          message: "Cupom processado com sucesso",
          parsedReceipt,
          saved
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ message: "Rota nao encontrada" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error?.message || "Erro interno"
      },
      { status: error?.status || 500 }
    );
  }
}

async function requireUser(request) {
  const token = getToken(request);
  if (!token) {
    const error = new Error("Sessao invalida");
    error.status = 401;
    throw error;
  }

  const user = await getUserFromToken(token);
  if (!user) {
    const error = new Error("Sessao expirada ou invalida");
    error.status = 401;
    throw error;
  }

  return user;
}

function getToken(request) {
  const header = request.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || user.full_name || ""
  };
}
