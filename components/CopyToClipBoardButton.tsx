"use client"

import { copyToClipboard } from "@/lib/utils"
import { useState } from "react"
import { Button } from "./ui/button"
import { Check, Copy } from "lucide-react"

export const CopyToClipBoardButton = ({ text }: { text: string }) => {
    const [addressIsCopied, setAddressIsCopied] = useState(false)

    function handleAddressCopy(text: string) {
        copyToClipboard(text)
        setAddressIsCopied(true)
        setTimeout(() => {
            setAddressIsCopied(false)
        }, 1000)
    }

    return (
        <Button
            variant="ghost"
            onClick={() => handleAddressCopy(text)}
            className={`p-0 ${addressIsCopied ? 'select-none' : ''}`}
        >
            {addressIsCopied ? (
                <Check className="w-4 h-4 stroke-green-700" />
            ) : (
                <Copy className="w-4 h-4" />
            )}
        </Button>
    )
}