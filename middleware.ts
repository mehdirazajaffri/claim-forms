import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = Boolean(req.auth)
  const isApiRoute = pathname.startsWith('/api/')

  const isPublicPath = pathname === '/login' || pathname.startsWith('/api/auth')

  if (!isAuthenticated && !isPublicPath) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
