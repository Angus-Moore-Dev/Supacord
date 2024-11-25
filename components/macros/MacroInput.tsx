'use client';

import { Input } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState, useEffect } from 'react';

/**
 * Props interface for the MacroInput component
 */
interface MacroInputProps
{
    /** The current title value */
    title: string;
    /** Callback function to update the title value in the parent component */
    setTitle: (title: string) => void;
}

/**
 * A debounced input component for editing macro titles
 * 
 * @component
 * @param {MacroInputProps} props - The component props
 * @param {string} props.title - The current title value
 * @param {Function} props.setTitle - Callback function to update the title
 * 
 * @returns A labeled input field with debounced updates
 * 
 * @example
 * ```tsx
 * <MacroInput 
 *   title="My Macro" 
 *   setTitle={(newTitle) => handleTitleChange(newTitle)} 
 * />
 * ```
 */
export default function MacroInput({ title, setTitle }: MacroInputProps)
{
    const [promptTitle, setPromptTitle] = useState(title);
    const [debouncedPromptTitle] = useDebouncedValue(promptTitle, 250);

    useEffect(() =>
    {
        setTitle(debouncedPromptTitle);
    }, [debouncedPromptTitle, setTitle]);


    return <Input.Wrapper label='Macro Title' required description="Change this if you want something more formal to summarise what data you're tracking">
        <Input
            size='lg'
            autoFocus
            placeholder='Enter a title for your macro'
            value={promptTitle}
            onChange={(e) => setPromptTitle(e.currentTarget.value)}
            className='font-bold'
        />
    </Input.Wrapper>;
}