import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://intakeforge-backend-527226736949.us-central1.run.app";

export async function GET(req: NextRequest) { return proxy(req); }
export async function POST(req: NextRequest) { return proxy(req); }
export async function PUT(req: NextRequest) { return proxy(req); }
export async function OPTIONS(req: NextRequest) { return new NextResponse(null, { status: 200 }); }

async function proxy(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "/";
  const url = `${BACKEND}${path}`;

  const auth = req.headers.get("authorization");
  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  // For multipart: parse the incoming form and re-post as FormData so fetch
  // generates a fresh boundary. For everything else: forward as text + content-type.
  let body: BodyInit | undefined;
  const headers: Record<string, string> = {};
  if (auth) headers["authorization"] = auth;

  if (req.method !== "GET" && req.method !== "HEAD") {
    if (isMultipart) {
      // Re-build FormData so the outgoing fetch sets its own correct boundary
      const incoming = await req.formData();
      const fd = new FormData();
      for (const [key, value] of incoming.entries()) {
        fd.append(key, value);
      }
      body = fd;
      // Do NOT set content-type — fetch will set it with the correct boundary
    } else {
      headers["content-type"] = contentType || "application/json";
      body = await req.text();
    }
  }

  const res = await fetch(url, { method: req.method, headers, body, redirect: "manual" });

  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location") || "/";
    return NextResponse.redirect(location);
  }

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}
