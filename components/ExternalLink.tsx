import React from 'react'
import ArrowRightIcon from './icons/arrow-right-icon'

export default function ExternalLink({
    href,
    children,
    className,
    variant = 'secondary',
    iconSize = 16,
    prefixIcon,
    suffixIcon,
    onClick,
    showIcon = true,
}: {
    href: string
    children?: React.ReactNode
    className?: string
    variant?: 'primary' | 'secondary' | 'ghost'
    iconSize?: number
    prefixIcon?: React.ReactNode
    suffixIcon?: React.ReactNode
    showIcon?: boolean
    onClick?: () => void
}) {
    const getColor = () => {
        if (variant === 'primary') return 'text-primary'
        if (variant === 'secondary') return 'text-secondary-500'
        return 'text-inherit'
    }

    const getStrokeColor = () => {
        if (variant === 'primary') return 'stroke-primary'
        if (variant === 'secondary') return 'stroke-secondary-500'
        return 'stroke-inherit'
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-fit shrink-0 inline-flex items-center gap-1 ${getColor()} leading-[0.5] ${className || ''}`}
            onClick={onClick ?? undefined}
        >
            {prefixIcon && prefixIcon}
            {children && children}
            {showIcon &&
                <ArrowRightIcon
                    weight="2.5"
                    className={`${getStrokeColor()} -rotate-45 translate-y-[1px] shrink-0`}
                    width={iconSize}
                    height={iconSize}
                />}
            {suffixIcon && suffixIcon}
        </a>
    )
}
