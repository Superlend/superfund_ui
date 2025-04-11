'use client'

import { Button } from '@/components/ui/button'
import { HeadingText, BodyText } from '@/components/ui/typography'
import MainContainer from '@/components/MainContainer'
import ImageWithDefault from '@/components/ImageWithDefault'
import { CHAIN_DETAILS } from '@/context/chain-context'
import { ChainId } from '@/types/chain'
import { motion } from 'motion/react'
import { useEffect } from 'react'

export default function ChainSelectionPage() {
  // Function to handle direct navigation using window.location
  // This bypasses Next.js client-side routing for more reliable navigation
  const navigateToChain = (path: string) => {
    console.log(`Navigating directly to: /super-fund/${path}`)
    window.location.href = `/super-fund/${path}`
  }
  
  // Log when this page is mounted
  useEffect(() => {
    console.log('Chain selection page mounted')
  }, [])

  return (
    <MainContainer className="flex flex-col items-center justify-center min-h-[80vh] py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full mx-auto text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <ImageWithDefault
            src={'/images/logos/superlend-rounded.svg'}
            alt="Bluechip Stable SuperFund"
            width={40}
            height={40}
          />
          <HeadingText level="h3" weight="medium" className="text-gray-800">
            Bluechip Stable SuperFund
          </HeadingText>
        </div>
        
        <BodyText level="body1" className="mb-8 text-gray-600">
          Select a blockchain network to access the SuperFund
        </BodyText>
        
        <div className="space-y-4">
          <Button 
            className="w-full h-14"
            onClick={() => navigateToChain('sonic')}
          >
            <div className="flex items-center justify-center gap-3">
              <ImageWithDefault
                src={CHAIN_DETAILS[ChainId.Sonic].logo}
                alt="Sonic"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span>Sonic Network</span>
            </div>
          </Button>
          
          <Button 
            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200"
            variant="outline"
            onClick={() => navigateToChain('base')}
          >
            <div className="flex items-center justify-center gap-3">
              <ImageWithDefault
                src={CHAIN_DETAILS[ChainId.Base].logo}
                alt="Base"
                width={24}
                height={24}
                className="rounded-full"
              />
              <span>Base Network</span>
            </div>
          </Button>
        </div>
      </motion.div>
    </MainContainer>
  )
}
