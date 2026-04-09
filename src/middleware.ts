import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ["/os", "/admin", "/inventario", "/catalog", "/note-preview"];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("carmd_session");

  // 1. Redirecciones de Compatibilidad (Legacy)
  
  // Redirigir /web-test a /
  if (pathname === "/web-test") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname === "/sobre-nosotros") {
    return NextResponse.redirect(new URL("/nosotros", request.url));
  }
  if (pathname === "/contacto") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/web-test/")) {
    const newPath = pathname.replace("/web-test/", "/");
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Redirigir rutas operativas antiguas a /os/
  const legacyTools = ["/inventario", "/admin", "/catalog", "/note-preview"];
  const legacyTool = legacyTools.find(tool => pathname === tool || pathname.startsWith(`${tool}/`));
  
  if (legacyTool && !pathname.startsWith("/os/")) {
    const newPath = pathname.replace(legacyTool, `/os${legacyTool}`);
    return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url));
  }

  // 2. Proteger las rutas operativas (/os y legadas)
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (logo.png, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|noise.svg).*)",
  ],
};
