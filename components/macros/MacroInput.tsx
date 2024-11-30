'use client';

import { NotebookEntry, Project } from '@/lib/global.types';
import { Button, Input } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { Brain } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Props interface for the MacroInput component
 */
interface MacroInputProps
{
    /** The ID of the project that the macro belongs to */
    project: Project;

    notebookEntry: NotebookEntry;
    
    /** The current title value */
    title: string;
    /** Callback function to update the title value in the parent component */
    setTitle: (title: string) => void;

    /** Whether the input is disabled */
    disabled?: boolean;
}

/**
 * A debounced input component for editing macro titles
 * 
 * @component
 * @param {MacroInputProps} props - The component props
 * @param {Project} props.project - The project that the macro belongs to
 * @param {string} props.title - The current title value
 * @param {NotebookEntry} props.notebookEntry - The notebook entry that the macro belongs to
 * @param {Function} props.setTitle - Callback function to update the title
 * @param {boolean} props.disabled - Whether the input is disabled
 * 
 * @returns A labeled input field with debounced updates
 * 
 * @example
 * ```tsx
 * <MacroInput 
 *   title="My Macro" 
 *   setTitle={(newTitle) => handleTitleChange(newTitle)} 
 *   disabled={true}
 * />
 * ```
 */
export default function MacroInput({ notebookEntry, title, setTitle, disabled = false }: MacroInputProps)
{
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
    const [promptTitle, setPromptTitle] = useState(title);
    const [debouncedPromptTitle] = useDebouncedValue(promptTitle, 250);

    useEffect(() =>
    {
        setTitle(debouncedPromptTitle);
    }, [debouncedPromptTitle, setTitle]);


    async function generateTitle()
    {
        setIsGeneratingTitle(true);
        if (isGeneratingTitle) return;

        const response = await fetch('/app/[id]/macro-naming', {
            method: 'POST',
            body: JSON.stringify(notebookEntry.sqlQueries.map(query => ({ sqlQuery: query, explanation: '' })))
        });

        const data = await response.json();
        setPromptTitle(data.title);
        setIsGeneratingTitle(false);
    }


    return <Input.Wrapper label='Macro Title' required description="Change this if you want something more formal to summarise what data you're tracking" className='flex flex-col'>
        <Input
            size='lg'
            autoFocus
            placeholder='Enter a title for your macro'
            value={promptTitle}
            onChange={(e) => setPromptTitle(e.currentTarget.value)}
            className='font-bold'
            disabled={disabled || isGeneratingTitle}
        />
        <Button className='ml-auto mt-2' size='xs' color='green' leftSection={<Brain size={16} />} onClick={generateTitle} loading={isGeneratingTitle}>
            Rename Macro With AI
        </Button>
    </Input.Wrapper>;
}