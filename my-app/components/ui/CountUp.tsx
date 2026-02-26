'use client';

import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

interface CountUpProps {
    end: number;
    duration?: number;
    delay?: number;
    suffix?: string;
    decimals?: number;
}

export default function CountUp({ 
    end, 
    duration = 2, 
    delay = 0,
    suffix = '', 
    decimals = 0 
}: CountUpProps) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (isInView && !hasAnimated.current) {
            hasAnimated.current = true;
            
            // Add delay
            const timeoutId = setTimeout(() => {
                let startTimestamp: number | null = null;
                
                const step = (timestamp: number) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
                    
                    // Ease out quart
                    const easeProgress = 1 - Math.pow(1 - progress, 4);
                    
                    setCount(easeProgress * end);
                    
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    } else {
                        setCount(end); // Ensure final value is exact
                    }
                };
                
                window.requestAnimationFrame(step);
            }, delay * 1000);

            return () => clearTimeout(timeoutId);
        }
    }, [isInView, end, duration, delay]);

    return (
        <span ref={ref}>
            {count.toFixed(decimals)}
            {suffix}
        </span>
    );
}
