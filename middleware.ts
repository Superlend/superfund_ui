import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()
    if (url.pathname === '/') {
        url.pathname = '/super-vault' // Set your desired default route here
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}
