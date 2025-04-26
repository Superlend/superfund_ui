import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()

    if (url.pathname === '/') {
        url.pathname = '/super-fund'
        return NextResponse.redirect(url)
    }

    // Skip redirecting API routes
    if (url.pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    // Skip redirecting static files and assets
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/images') ||
        url.pathname.includes('.') ||
        url.pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    // Skip if already on waitlist page OR super-fund page
    if (url.pathname === '/waitlist' || url.pathname === '/super-fund' || url.pathname === '/super-fund/base') {
        return NextResponse.next()
    }

    if (url.pathname === '/super-fund/sonic') {
        url.pathname = '/waitlist'
        return NextResponse.redirect(url)
    }

    // Redirect all other paths to waitlist
    url.pathname = '/super-fund'
    return NextResponse.redirect(url)
}
