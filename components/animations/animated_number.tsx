
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimatedNumberProps {
    value: string;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        setDisplayValue(value);
    }, [value]);

    return (
        <div className={`inline-flex items-baseline ${className}`}>
            {prefix && (
                <div className="flex-shrink-0 mr-[1px] leading-none">
                    {prefix}
                </div>
            )}
            <div className="inline-flex leading-none">
                {value.split('').map((char, i) => {
                    const prevChar = displayValue[i];
                    const key = `${i}-${char}`;
                    const hasChanged = char !== prevChar;

                    return (
                        <div
                            key={key}
                            className="relative inline-block overflow-hidden"
                            style={{
                                height: '1.0em',
                                width: char === '.' ? '0.25em' :
                                    char === '%' ? '0.8em' :
                                        '0.65em',
                                transform: 'translateY(0.1em)'
                            }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={char}
                                    initial={hasChanged ? { y: 20, opacity: 0 } : false}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute left-0 inline-flex items-baseline justify-center w-full"
                                >
                                    {char}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
            {suffix && (
                <div className="flex-shrink-0 ml-[1px] leading-none">
                    {suffix}
                </div>
            )}
        </div>
    );
}