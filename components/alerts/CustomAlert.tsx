import { InfoIcon, TriangleAlert } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import DangerSquare from '@/components/icons/danger-square'

export default function CustomAlert({
    variant = 'destructive',
    hasPrefixIcon = true,
    description,
    size = 'default',
}: {
    variant?: 'destructive' | 'warning' | 'info'
    hasPrefixIcon?: boolean
    description: React.ReactNode | string
    size?: 'default' | 'sm' | 'xs'
}) {
    return (
        <Alert variant={variant} size={size}>
            <AlertDescription className="flex items-start justify-start gap-1 overflow-hidden">
                {/* {hasPrefixIcon && variant === 'destructive' && (
                    <DangerSquare
                        width={18}
                        height={18}
                        className="stroke-destructive-foreground shrink-0"
                    />
                )} */}
                {hasPrefixIcon && variant === 'warning' && (
                    <TriangleAlert
                        width={18}
                        height={18}
                        className="stroke-warning-foreground shrink-0 pt-[3px]"
                    />
                )}
                {hasPrefixIcon &&
                    (variant === 'info' || variant === 'destructive') && (
                        <InfoIcon
                            width={18}
                            height={18}
                            className="stroke-info-foreground shrink-0 pt-[3px]"
                        />
                    )}
                {typeof description === 'string' && (
                    <span className="leading-0 font-medium line-clamp-3">{description}</span>
                )}
                {typeof description !== 'string' && description}
            </AlertDescription>
        </Alert>
    )
}
