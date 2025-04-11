import { Button } from '@/components/ui/button'
import { HeadingText, BodyText } from '@/components/ui/typography'
import Link from 'next/link'

export default function ChainNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <HeadingText level="h2" weight="medium" className="mt-6">
          Chain Not Found
        </HeadingText>
        <BodyText level="body1" className="mt-2 text-gray-600">
          The requested blockchain network is not supported by SuperFund.
        </BodyText>
        <div className="mt-6 space-y-4">
          <Button asChild className="w-full">
            <Link href="/super-fund/sonic">
              Go to Sonic SuperFund
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/super-fund/base">
              Go to Base SuperFund
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 