import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()
    if (url.pathname === '/' || url.pathname === '/super-fund') {
        url.pathname = '/super-fund/sonic'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}
