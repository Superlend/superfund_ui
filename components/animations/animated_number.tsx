
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimatedNumberProps {
    value: string;
    prefix?: string;
    suffix?: string;
    className?: string;
    overallDirection?: 'increment' | 'decrement' | 'auto';
    previousValue?: string; // Add previous value for better context
}

export function AnimatedNumber({ value, prefix = '', suffix = '', className = '', overallDirection = 'auto', previousValue }: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        setDisplayValue(value);
    }, [value]);

    // Simplified animation - no complex cascading logic

    return (
        <div className={`inline-flex items-baseline ${className}`}>
            {prefix && (
                <div className="flex-shrink-0 mr-[1px] leading-none">
                    {prefix}
                </div>
            )}
            <div className="inline-flex leading-none">
                {value.split('').map((char, i) => {
                    const prevChar = displayValue[i] || '';
                    const key = `${i}-${char}`;
                    const hasChanged = char !== prevChar;



                    // Check if this is a digit that should get slot machine effect
                    const isDigit = /^\d$/.test(char);
                    const prevIsDigit = /^\d$/.test(prevChar || '0');
                    const shouldUseSlotMachine = isDigit && prevIsDigit && hasChanged;
                    
                    // Removed cascading logic for simplicity
                    
                    let slotMachineAnimation: {
                        initial: any;
                        animate: any;
                        exit: any;
                        transition: any;
                    };
                                            if (shouldUseSlotMachine) {
                            // Independent movement for each digit
                            const rollDistance = 30; 
                            const baseDuration = 0.6; // Base duration
                            const randomVariation = Math.random() * 0.4; // 0 to 0.4 seconds variation
                            const independentDuration = baseDuration + randomVariation; // 0.6 to 1.0 seconds
                            
                            // Use overall direction instead of individual digit comparison for consistency
                            // This ensures all digits animate in the same direction as the overall number change
                            const isOverallIncrement = overallDirection === 'increment' || 
                                (overallDirection === 'auto' && true); // Default to increment if auto
                        
                        if (isOverallIncrement) {
                            // For increments: new number enters from bottom, old exits to top
                            // ALL digits follow the same direction regardless of individual digit change
                            slotMachineAnimation = {
                                initial: { y: rollDistance, opacity: 0.8 },
                                animate: { y: 0, opacity: 1 },
                                exit: { y: -rollDistance, opacity: 0.2 },
                                transition: { 
                                    duration: independentDuration, // Each digit has its own timing
                                    ease: "easeInOut",
                                    delay: Math.random() * 0.1 // Small random delay (0-100ms) for natural feel
                                }
                            };
                        } else {
                            // For decrements: new number enters from top, old exits to bottom
                            // ALL digits follow the same direction regardless of individual digit change
                            slotMachineAnimation = {
                                initial: { y: -rollDistance, opacity: 0.8 },
                                animate: { y: 0, opacity: 1 },
                                exit: { y: rollDistance, opacity: 0.2 },
                                transition: { 
                                    duration: independentDuration, // Each digit has its own timing
                                    ease: "easeInOut",
                                    delay: Math.random() * 0.1 // Small random delay (0-100ms) for natural feel
                                }
                            };
                        }
                    } else {
                        // Default animation for non-digits or no change - also independent
                        const baseDuration = 0.5;
                        const randomVariation = Math.random() * 0.3;
                        const independentDuration = baseDuration + randomVariation;
                        
                        slotMachineAnimation = {
                            initial: hasChanged ? { y: 20, opacity: 0.8 } : false,
                            animate: { y: 0, opacity: 1 },
                            exit: { y: -20, opacity: 0.2 },
                            transition: { 
                                duration: independentDuration, // Independent timing for non-digits too
                                ease: "easeInOut",
                                delay: Math.random() * 0.05 // Smaller delay for non-digits
                            }
                        };
                    }

                    return (
                        <div
                            key={key}
                            className="relative inline-block overflow-hidden"
                            style={{
                                height: '1.0em',
                                width: (char === '.' || char === ',') ? '0.25em' :
                                    char === '%' ? '0.8em' :
                                        '0.65em',
                                transform: 'translateY(0.1em)'
                            }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={char}
                                    initial={hasChanged ? slotMachineAnimation.initial : false}
                                    animate={slotMachineAnimation.animate}
                                    exit={slotMachineAnimation.exit}
                                    transition={slotMachineAnimation.transition}
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