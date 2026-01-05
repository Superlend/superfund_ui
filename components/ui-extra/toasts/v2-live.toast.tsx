'use client'

import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import ImageWithDefault from '@/components/ImageWithDefault'
import { BodyText } from '@/components/ui/typography'

interface V2LiveToastProps {
    id: string | number
    onDismiss?: () => void
}

const V2LiveToast = ({ id, onDismiss }: V2LiveToastProps) => {
    const handleDismiss = () => {
        toast.dismiss(id)
        if (onDismiss) onDismiss()
    }

    const handleExplore = () => {
        handleDismiss()
    }

    return (
        <div className="relative flex h-[150px] w-full overflow-hidden rounded-2xl bg-[url('/banners/redirection-toast.png')] bg-cover bg-center bg-no-repeat p-4 shadow-lg sm:p-5 lg:w-[510px]">
            <ImageWithDefault
                alt="cloud-1"
                className="absolute -left-10 -top-[50px] mix-blend-overlay"
                height={70}
                src="/images/decorative/cloud-blue.png"
                width={181}
            />
            <ImageWithDefault
                alt="cloud-2"
                className="absolute -bottom-[30px] -left-10 mix-blend-overlay"
                height={54.77}
                src="/images/decorative/cloud-blue.png"
                width={140.03}
            />
            {/* Close Button */}
            <Button
                className="absolute right-3 top-3 z-[10] h-auto p-1 text-orange-900/50 transition-colors hover:bg-white/20 hover:text-orange-900 rounded-full"
                onClick={handleDismiss}
                variant="ghost"
            >
                <X size={16} />
                <span className="sr-only">close</span>
            </Button>

            <div className="flex w-full justify-between gap-4">
                {/* Left Content */}
                <div className="flex flex-col gap-3 lg:max-w-[70%]">
                    <div>
                        <BodyText
                            className="!text-orange-900"
                            weight="bold"
                            level="body1"
                        >
                            Superlend V2 is live!
                        </BodyText>
                        <BodyText
                            className="opacity-90 !text-orange-900"
                            level="body2"
                        >
                            Major performance and UX upgrades are here.
                        </BodyText>
                    </div>

                    <div className="mt-1 flex gap-3 w-fit">
                        <Button
                            className="z-10 border-none !px-6"
                            onClick={handleExplore}
                            variant="primary"
                            size="lg"
                        >
                            Explore V2
                        </Button>
                    </div>
                </div>

                {/* Right Image (S Logo) */}
                <div className="absolute -right-[160px] -top-[30px] z-[0] hidden h-full w-full items-center justify-center lg:flex pointer-events-none">
                    <ImageWithDefault
                        alt="Superlend Logo"
                        className="!max-w-full"
                        height={500}
                        src="/images/decorative/superlend-coin-1.png"
                        width={500}
                    />
                </div>
            </div>
        </div>
    )
}

export { V2LiveToast }
