import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()

    // if (url.pathname === '/' || url.pathname === '/super-fund') {
    //     url.pathname = '/super-fund/sonic'
    //     return NextResponse.redirect(url)
    // }
    
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
    
    // Skip if already on waitlist page
    if (url.pathname === '/waitlist') {
        return NextResponse.next()
    }
    
    // Redirect all other paths to waitlist
    url.pathname = '/waitlist'
    return NextResponse.redirect(url)
}
