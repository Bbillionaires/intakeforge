import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://intakeforge-backend-527226736949.us-central1.run.app";

export async function GET(req: NextRequest) {
  return proxy(req);
}
export async function POST(req: NextRequest) {
  return proxy(req);
}
export async function PUT(req: NextRequest) {
  return proxy(req);
}
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

async function proxy(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "/";
  const url = `${BACKEND}${path}`;
  
  const headers: Record<string, string> = {};
  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  const contentType = req.headers.get("content-type") || "";
  // For multipart/form-data let the browser boundary pass through; for others set JSON
  if (req.method !== "GET" && req.method !== "HEAD" && !contentType.includes("multipart/form-data")) {
    headers["content-type"] = contentType || "application/json";
  }

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = contentType.includes("multipart/form-data")
      ? await req.blob()   // pass raw multipart bytes unchanged
      : await req.text();
  }

  const res = await fetch(url, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  });

  // Handle redirects from OAuth
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
