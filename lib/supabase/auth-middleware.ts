import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  let user = null
  try {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.log("[v0] Middleware auth error (expected for logged out users):", error.message)
      // Clear potentially corrupted auth cookies
      supabaseResponse.cookies.delete("sb-access-token")
      supabaseResponse.cookies.delete("sb-refresh-token")
    } else {
      user = authUser
    }
  } catch (error) {
    console.log("[v0] Middleware auth exception (expected for logged out users):", error)
    // Clear potentially corrupted auth cookies
    supabaseResponse.cookies.delete("sb-access-token")
    supabaseResponse.cookies.delete("sb-refresh-token")
  }

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")
  const isStaticFile = request.nextUrl.pathname.startsWith("/_next") || request.nextUrl.pathname.includes(".")

  if (isStaticFile || isApiRoute) {
    return supabaseResponse
  }

  console.log("[v0] Middleware - User:", user?.id || "none", "Path:", request.nextUrl.pathname)

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("returnTo", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage && request.nextUrl.pathname !== "/auth/error") {
    const returnTo = request.nextUrl.searchParams.get("returnTo")
    const url = request.nextUrl.clone()
    url.pathname = returnTo || "/"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
