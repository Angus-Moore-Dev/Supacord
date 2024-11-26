'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@mantine/core';
import getGradientColour from '@/utils/getGradientColour';
import { useDebouncedValue } from '@mantine/hooks';

interface PollingSlidersProps
{
    seconds: number;
    minutes: number;
    hours: number;
    days: number;
    onChange: (seconds: number, minutes: number, hours: number, days: number) => void;
    disabled?: boolean;
}

export default function PollingSliders({ seconds, minutes, hours, days, onChange, disabled = false }: PollingSlidersProps) 
{
    const [secondsPolling, setSecondsPolling] = useState(seconds);
    const [minutesPolling, setMinutesPolling] = useState(minutes);
    const [hoursPolling, setHoursPolling] = useState(hours);
    const [daysPolling, setDaysPolling] = useState(days);

    const [debouncedSecondsPolling] = useDebouncedValue(secondsPolling, 250);
    const [debouncedMinutesPolling] = useDebouncedValue(minutesPolling, 250);
    const [debouncedHoursPolling] = useDebouncedValue(hoursPolling, 250);
    const [debouncedDaysPolling] = useDebouncedValue(daysPolling, 250);


    // Add useEffect to call onChange when any value changes
    useEffect(() => 
    {
        onChange(debouncedSecondsPolling, debouncedMinutesPolling, debouncedHoursPolling, debouncedDaysPolling);
    }, [debouncedSecondsPolling, debouncedMinutesPolling, debouncedHoursPolling, debouncedDaysPolling, onChange]);


    return <section className='flex flex-col gap-5'>
        <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
            <p>
                This macro will run every <b className='text-green'>{secondsPolling}s, {minutesPolling}m, {hoursPolling}h, {daysPolling}d</b>.
            </p>
        </div>
        <div className='flex flex-col gap-5 flex-1'>
            {/* Polling Rates Slider */}
            <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
                <p>
                    Seconds
                </p>
                <Slider
                    disabled={disabled}
                    value={secondsPolling}
                    onChange={setSecondsPolling}
                    color={getGradientColour(secondsPolling, 0, 60)}
                    marks={[
                        { value: 0, label: '0s' },
                        { value: 10, label: '10s' },
                        { value: 20, label: '20s' },
                        { value: 30, label: '30s' },
                        { value: 45, label: '45s' },
                        { value: 60, label: '60s' }
                    ]}
                    min={0}
                    max={60}
                    className='mb-6'
                />
            </div>
            <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
                <p>
                    Minutes
                </p>
                <Slider
                    disabled={disabled}
                    value={minutesPolling}
                    onChange={setMinutesPolling}
                    color={getGradientColour(minutesPolling, 0, 60)}
                    marks={[
                        { value: 0, label: '0m' },
                        { value: 15, label: '15m' },
                        { value: 30, label: '30m' },
                        { value: 45, label: '45m' },
                        { value: 60, label: '60m' }
                    ]}
                    min={0}
                    max={60}
                    className='mb-6'
                />
            </div>
            <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
                <p>
                    Hours
                </p>
                <Slider
                    disabled={disabled}
                    value={hoursPolling}
                    onChange={setHoursPolling}
                    color={getGradientColour(hoursPolling, 0, 24)}
                    marks={[
                        { value: 0, label: '0h' },
                        { value: 6, label: '6h' },
                        { value: 12, label: '12h' },
                        { value: 18, label: '18h' },
                        { value: 24, label: '24h' }
                    ]}
                    min={0}
                    max={24}
                    className='mb-6'
                />
            </div>
            <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
                <p>
                    Days
                </p>
                <Slider
                    disabled={disabled}
                    value={daysPolling}
                    onChange={setDaysPolling}
                    color={getGradientColour(daysPolling, 0, 30)}
                    marks={[
                        { value: 0, label: '0d' },
                        { value: 7, label: '7d' },
                        { value: 14, label: '14d' },
                        { value: 21, label: '21d' },
                        { value: 30, label: '30d' }
                    ]}
                    min={0}
                    max={30}
                    className='mb-6'
                />
            </div>
        </div>
    </section>;
}