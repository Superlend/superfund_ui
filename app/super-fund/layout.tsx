'use client'

import React from 'react'
import TxProvider from '@/context/super-vault-tx-provider'

export default function SuperFundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TxProvider>
      {children}
    </TxProvider>
  )
} 