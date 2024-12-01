import { MacroPollingRate } from '@/lib/global.types';
import React, { useEffect, useState } from 'react';

interface RainbowTimerProps {
    latestTime: number; // UTC seconds
    pollingRate: MacroPollingRate;
}

export default function RainbowTimer({ latestTime, pollingRate }: RainbowTimerProps): JSX.Element 
{
    const [progress, setProgress] = useState(0);
    const [timeUntilNextInvocation, setTimeUntilNextInvocation] = useState('');

    useEffect(() => 
    {
        // Reset progress when latestTime changes
        setProgress(0);
        
        const calculateProgress = () => 
        {
            const now = Math.floor(Date.now() / 1000); // Convert to UTC seconds
            const elapsed = now - latestTime;

            // Calculate total seconds from polling rate
            const totalSeconds = (
                pollingRate.days * 24 * 60 * 60 +
                pollingRate.hours * 60 * 60 + 
                pollingRate.minutes * 60 +
                pollingRate.seconds
            );

            // If we're beyond the polling rate, set progress to 1 (red)
            if (elapsed > totalSeconds) 
            {
                setProgress(1);
                setTimeUntilNextInvocation('00:00:00');
                return;
            }

            // For new invocations, we only care about the current cycle
            const remainingSeconds = totalSeconds - (elapsed % totalSeconds);
            
            // Convert to progress (1 = just started, 0 = about to invoke)
            const newProgress = remainingSeconds / totalSeconds;
            setProgress(1 - newProgress); // Invert so progress increases as we get closer

            // Calculate time until next invocation immediately after updating progress
            const hours = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(Math.floor(remainingSeconds % 60)).padStart(2, '0');
            setTimeUntilNextInvocation(`${hours}:${minutes}:${seconds}`);
        };

        calculateProgress();
        const interval = setInterval(calculateProgress, 250);
    
        return () => 
        {
            clearInterval(interval);
        };
    }, [latestTime, pollingRate]);

    // Convert progress (0-1) to hue (240-0, blue to red)
    const hue = 240 * (1 - progress);
    const color = `hsl(${hue}, 100%, 50%)`;

    // Calculate rotation angle (0-360 degrees), negative for counter-clockwise
    const rotation = -progress * 360;

    return (
        <div className='flex gap-3 items-center'>
            <p className='text-sm font-medium'>{timeUntilNextInvocation}</p>
            <div className={`relative w-8 h-8 min-w-8 min-h-8 ${progress >= 1 ? 'animate-pulse' : ''}`}>
                <svg 
                    viewBox="0 0 40 40" 
                    className="w-full h-full transform"
                >
                    {/* Outer circle */}
                    <circle
                        cx="20"
                        cy="20"
                        r="17"
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                    />
        
                    {/* Timer line */}
                    <line
                        x1="20"
                        y1="20"
                        x2="20"
                        y2="3"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{
                            transformOrigin: '20px 20px',
                            transform: `rotate(${rotation}deg)`,
                            transition: 'transform 0.05s linear'
                        }}
                    />
        
                    {/* Center dot */}
                    <circle
                        cx="20"
                        cy="20"
                        r="2"
                        fill={color}
                    />
                </svg>
            </div>
        </div>
    );
}