const API_BASE = "/api";

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 15000;
  const timeout = setTimeout(() => controller.abort(`timeout:${timeoutMs}`), timeoutMs);

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  let body = options.body;

  if (body && !(body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method || "GET",
      headers,
      body,
      cache: "no-store",
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error?.name === "AbortError") {
      throw new Error("A requisicao demorou mais do que o esperado. Tente novamente.");
    }
    throw error;
  }

  clearTimeout(timeout);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Falha na requisicao");
  }

  return data;
}

export const api = {
  guest(guestCode = "") {
    return request("/auth/guest", { method: "POST", body: { guestCode }, timeoutMs: 25000 });
  },
  register(payload) {
    return request("/auth/register", { method: "POST", body: payload });
  },
  login(payload) {
    return request("/auth/login", { method: "POST", body: payload });
  },
  me(token) {
    return request("/auth/me", { token });
  },
  logout(token) {
    return request("/auth/logout", { method: "POST", token });
  },
  dashboard(token) {
    return request("/dashboard", { token });
  },
  purchases(token) {
    return request("/purchases", { token });
  },
  createPurchase(token, parsedReceipt) {
    return request("/purchases", {
      method: "POST",
      token,
      body: { parsedReceipt }
    });
  },
  dataItems(token) {
    return request("/data-items", { token });
  },
  updatePurchaseItem(token, id, payload) {
    return request(`/purchase-items/${id}`, { method: "PATCH", token, body: payload });
  },
  products(token, query = "") {
    return request(`/products?q=${encodeURIComponent(query)}`, { token });
  },
  product(token, id) {
    return request(`/products/${id}`, { token });
  },
  priceLookup(token, query = "") {
    return request(`/price-lookup?q=${encodeURIComponent(query)}`, { token });
  },
  uploadReceipt(token, payload) {
    return request("/upload-receipt", {
      method: "POST",
      token,
      body: payload,
      timeoutMs: 240000
    });
  },
  askAi(token, question) {
    return request("/ai/ask", {
      method: "POST",
      token,
      body: { question }
    });
  }
};
