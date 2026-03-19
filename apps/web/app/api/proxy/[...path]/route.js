const API_BASE = "http://localhost:4000/api";

export async function GET(request, context) {
  return proxyRequest(request, context);
}

export async function POST(request, context) {
  return proxyRequest(request, context);
}

export async function PUT(request, context) {
  return proxyRequest(request, context);
}

export async function PATCH(request, context) {
  return proxyRequest(request, context);
}

export async function DELETE(request, context) {
  return proxyRequest(request, context);
}

async function proxyRequest(request, context) {
  const path = context.params.path.join("/");
  const url = new URL(request.url);
  const target = `${API_BASE}/${path}${url.search}`;
  const contentType = request.headers.get("content-type") || "";

  const headers = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) {
    headers.set("authorization", auth);
  }

  let body;
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType.includes("multipart/form-data")) {
      const incoming = await request.formData();
      const forwarded = new FormData();
      for (const [key, value] of incoming.entries()) {
        forwarded.append(key, value);
      }
      body = forwarded;
    } else {
      const text = await request.text();
      if (text) {
        body = text;
      }
      if (contentType) {
        headers.set("content-type", contentType);
      }
    }
  }

  const response = await fetch(target, {
    method: request.method,
    headers,
    body
  });

  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers();
  const responseType = response.headers.get("content-type");
  if (responseType) {
    responseHeaders.set("content-type", responseType);
  }

  return new Response(responseBody, {
    status: response.status,
    headers: responseHeaders
  });
}
