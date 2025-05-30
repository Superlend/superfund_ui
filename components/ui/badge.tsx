import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
    'inline-flex items-center border py-[4px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none leading-none',
    {
        variants: {
            variant: {
                default:
                    'border bg-white text-gray-800 hover:bg-gray-200 [&.selected]:border-secondary-500 [&.selected]:ring-2 [&.selected]:ring-secondary-100/50 transition-colors duration-200 ease-in-out',
                secondary:
                    'border-transparent bg-secondary-500 text-secondary-foreground hover:bg-secondary/25 text-white',
                destructive:
                    'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive',
                outline: 'text-gray-500 bg-transparent hover:bg-gray-300',
                link: 'border-transparent text-secondary-500',
                green: 'border-transparent bg-[#00C939] bg-opacity-10 text-[#00AD31]',
                blue: 'border-transparent bg-secondary-100/15 text-secondary-500',
                yellow: 'border-transparent bg-[#FFA319]/15 text-[#D19900]',
            },
            size: {
                sm: 'text-[11px] px-[4px] rounded-3 uppercase',
                md: 'text-[12px] px-[6px] rounded-3',
                lg: 'text-[14px] px-[8px] rounded-3',
                xl: 'text-[16px] px-[10px] rounded-3',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'sm',
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return (
        <span
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
        />
    )
}

export { Badge, badgeVariants }
