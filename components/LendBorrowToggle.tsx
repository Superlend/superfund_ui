'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { TPositionType } from '@/types'

type TProps = {
    type: TPositionType
    handleToggle: (positionType: TPositionType) => void
    addCollateral?: boolean
    title?: {
        deposit?: string
        withdraw?: string
    }
    showTab?: {
        deposit?: boolean
        withdraw?: boolean
    }
}

const titleInitial = {
    deposit: 'Deposit',
    withdraw: 'Withdraw',
}

const showTabInitial = {
    deposit: true,
    withdraw: true,
}

const LendBorrowToggle = ({ type, handleToggle, title, showTab }: TProps) => {
    const positionType: Record<TPositionType, TPositionType> = {
        deposit: 'deposit',
        withdraw: 'withdraw',
        claim: 'claim',
    }

    function checkType(typeToMatch: TPositionType): boolean {
        return positionType[typeToMatch] === type
    }

    const BUTTON_DEFAULT_STYLE =
        'flex items-center justify-center py-[8px] grow-1 min-w-[120px] w-full flex-1 h-full my-auto hover:bg-white/45 uppercase font-semibold rounded-3'
    const BUTTON_ACTIVE_STYLE =
        'shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)]'

    return (
        <div className="flex gap-1 items-center w-full p-[4px] tracking-normal leading-tight uppercase whitespace-nowrap rounded-4 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)]">
            {(showTab ? showTab?.deposit : showTabInitial.deposit) && (
                <Button
                    variant={checkType('deposit') ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleToggle('deposit')}
                    className={`${BUTTON_DEFAULT_STYLE} ${checkType('deposit') ? BUTTON_ACTIVE_STYLE : ''}`}
                >
                    {title?.deposit || titleInitial.deposit}
                </Button>
            )}
            {(showTab ? showTab?.withdraw : showTabInitial.withdraw) && (
                <Button
                    variant={checkType('withdraw') ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handleToggle('withdraw')}
                    className={`${BUTTON_DEFAULT_STYLE} ${checkType('withdraw') ? BUTTON_ACTIVE_STYLE : ''}`}
                >
                    {title?.withdraw || titleInitial.withdraw}
                </Button>
            )}
        </div>
    )
}

export default LendBorrowToggle
