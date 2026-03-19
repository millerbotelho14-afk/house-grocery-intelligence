const API_BASE = "/api";

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  let body = options.body;

  if (body && !(body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body,
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Falha na requisicao");
  }

  return data;
}

export const api = {
  guest(guestCode = "") {
    return request("/auth/guest", { method: "POST", body: { guestCode } });
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
      body: payload
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
