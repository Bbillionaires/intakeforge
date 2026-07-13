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
  if (req.method !== "GET" && req.method !== "HEAD") {
    headers["content-type"] = req.headers.get("content-type") || "application/json";
  }

  const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;

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
