"use client"

import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '../ui/button';
import { allChains } from "@/data/all-chains";
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import Image from 'next/image';
import { IChain } from '@/types/chain';

export default function ChainSelectorDropdown() {
    const [selectedChain, setSelectedChain] = React.useState(allChains[0]);
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button title={selectedChain.name} size="lg" className="w-fit flex items-center gap-1 capitalize data-[state=open]:ring-2 data-[state=open]:ring-secondary-500 text-gray-600 rounded-xl">
                    <div className="flex flex-row-reverse items-center">
                        {
                            allChains
                                .filter((_, index: number) => index < 4 && index > 0)
                                .map((chain: IChain) => (
                                    <img key={chain.chainId} src={chain.image} alt={chain.name} width={20} height={20}
                                        className="object-contain rounded-full last:ml-0 -ml-3" />
                                ))
                        }
                    </div>
                    <div className="max-w-[100px] truncate">{selectedChain.name}</div>
                    <ChevronDownIcon className={`w-4 h-4 ml-2 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuGroup>
                    {allChains.map((chain) => (
                        <DropdownMenuItem key={chain.id} className="cursor-pointer hover:bg-gray-200 focus:bg-gray-200 flex items-between gap-3" onClick={() => setSelectedChain(chain)}>
                            <div key={chain.id} className="flex items-center gap-2">
                                <img src={chain.image} alt={chain.name} className="w-4 h-4" />
                                {chain.name}
                            </div>
                            <CheckIcon className={`w-[15px] h-[15px] ml-auto bg-secondary-500 text-white rounded-full p-[2px] ${selectedChain.id === chain.id ? 'opacity-100' : 'opacity-0'}`} />
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
