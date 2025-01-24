"use client"

import React from 'react'
import { motion } from "motion/react"
import { HeadingText } from '@/components/ui/typography'
import useIsClient from '@/hooks/useIsClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function PageHeader() {

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <HeadingText level="h2" weight="medium">
                Bluechip Stable SuperFund
            </HeadingText>
        </motion.div>
    )
}
