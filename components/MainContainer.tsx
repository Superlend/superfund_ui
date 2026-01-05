import React from 'react'

interface IMainContainer {
    children: React.ReactNode
    className?: string
    [key: string]: any
}

export default function MainContainer({
    children,
    className,
    ...props
}: IMainContainer) {
    return (
        <main
            className={`max-w-[1200px] mx-auto pb-[50px] mt-14 md:mt-20 ${className?.includes('px-0') ? '' : 'px-5'} ${className || ''}`}
            {...props}
        >
            {children}
        </main>
    )
}
