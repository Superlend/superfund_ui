import { Button } from '@/components/ui/button'
import { HeadingText, BodyText } from '@/components/ui/typography'
import Link from 'next/link'

export default function ChainNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center mt-12">
        <HeadingText level="h2" weight="medium">
          Chain Not Found
        </HeadingText>
        <BodyText level="body1" className="mt-2 text-gray-600">
          The requested blockchain network is not supported by SuperFund.
        </BodyText>
        <div className="mt-6 space-y-4">
          <Button asChild className="w-full py-4">
            <Link href="/super-fund/sonic">
              Go to Sonic Chain
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full py-4">
            <Link href="/super-fund/base">
              Go to Base Chain
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 