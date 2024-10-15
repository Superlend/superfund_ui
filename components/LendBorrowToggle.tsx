"use client";
import React, { useState } from 'react';
import { Button } from './ui/button';
import { TPositionType } from '@/types';

type TProps = {
  type: TPositionType;
  handleToggle: (positionType: TPositionType) => void;
}

const LendBorrowToggle = ({ type, handleToggle }: TProps) => {
  const positionType = {
    lend: "lend",
    borrow: "borrow",
  }

  function checkType(typeToMatch: TPositionType): boolean {
    return positionType[typeToMatch] === type;
  }

  const BUTTON_DEFAULT_STYLE = "flex items-center justify-center py-[8px] grow-1 basis-1/2 sm:w-[120px] h-full my-auto hover:bg-white/45 uppercase font-semibold rounded-3";
  const BUTTON_ACTIVE_STYLE = "shadow bg-[linear-gradient(180deg,#FF5B00_0%,#F55700_100%)]";

  return (
    <div className="flex gap-1 items-center w-full p-[4px] tracking-normal leading-tight uppercase whitespace-nowrap rounded-4 text-stone-800 bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)]">
      <Button variant={checkType("lend") ? "primary" : "ghost"} size="sm" onClick={() => handleToggle("lend")} className={`${BUTTON_DEFAULT_STYLE} ${checkType("lend") ? BUTTON_ACTIVE_STYLE : ''}`}>
        Lend
      </Button>
      <Button variant={checkType("borrow") ? "primary" : "ghost"} size="sm" onClick={() => handleToggle("borrow")} className={`${BUTTON_DEFAULT_STYLE} ${checkType("borrow") ? BUTTON_ACTIVE_STYLE : ''}`}>
        Borrow
      </Button>
    </div>
  );
};

export default LendBorrowToggle;