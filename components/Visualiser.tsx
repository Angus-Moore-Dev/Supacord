/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { PrimaryKeyEntities } from '@/lib/global.types';
import { Alert, Button, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Search } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Graph from './visualiser/Graph';
import Logo from '@/public/supacord_logo_transparent.png';
import Image from 'next/image';


export default function Visualiser({ project }: { project: { id: string, databaseName: string } }) 
{
    const searchBarRef = useRef<HTMLDivElement>(null);

    const [projectDetails] = useState<{ id: string, databaseName: string }>(project);

    const [errorText, setErrorText] = useState('');
    const [search, setSearch] = useState('');

    const [showResults, setShowResults] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const [resultsOpacity, setResultsOpacity] = useState(1);

    const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);

    const [searchResults, setSearchResults] = useState<{ type: 'user' | 'ai', content: string }[]>([]);

    const [gData, setGData] = useState<{
        links: { source: string, target: string }[],
        nodes: { primaryKey: string, id: string, dbRelationship: string }[],
    }>({
        links: [],
        nodes: [],
    });

    const [isDragging, setIsDragging] = useState(false);
    const [splitPosition, setSplitPosition] = useState(60); // Initial split at 60%

    const handleMouseDown = useCallback((e: { preventDefault: () => void; }) => 
    {
        e.preventDefault();
        setIsDragging(true);
    }, []);
        
    const handleMouseMove = useCallback((e: any) => 
    {
        if (!isDragging) return;
            
        const container = e.currentTarget;
        const containerRect = container.getBoundingClientRect();
            
        // Calculate from right edge instead of left
        const splitPercentage = (1 - ((e.clientX - containerRect.left) / containerRect.width)) * 100;
            
        // Limit the split position between 20% and 80%
        const limitedSplit = Math.min(Math.max(splitPercentage, 20), 80);
        setSplitPosition(limitedSplit);
        
        // update the width of the visualiser-container
        const visualiserContainer = document.getElementById('visualiser-container');
        if (visualiserContainer)
        {
            visualiserContainer.style.width = `${limitedSplit}%`;
            setWidth(visualiserContainer.clientWidth);
        }
    }, [isDragging]);

    const handleMouseUp = useCallback(() => 
    {
        setIsDragging(false);
    }, []);

    async function searchDatabase() 
    {
        if (isSearching || !projectDetails)
            return;
        setIsSearching(true);
        setErrorText('');

        try 
        {
            const response = await fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: projectDetails.id,
                    searchQuery: search,
                    chatHistory: [...searchResults.slice(1), { type: 'user', content: search }].slice(-5)
                }),
            });

            setSearchResults(searchResults => [...searchResults, { type: 'user', content: search }]);
    
            if (!response.ok || response.body === null) 
            {
                throw new Error('Failed to search database');
            }
    
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
    
            let isDone: boolean = false;
            do
            {
                const { done, value } = await reader.read();
                isDone = done;

                const chunk = decoder.decode(value, { stream: true });
                console.log(chunk, chunk.startsWith('\n=====START_PRIMARY_KEYS====='), chunk.endsWith('=====END_PRIMARY_KEYS=====\n'));
                // setSearchResults(prevResults => prevResults + chunk);
                setSearchResults(searchResults => 
                {
                    if (searchResults[searchResults.length - 1]?.type === 'user')
                    {
                        if (chunk.startsWith('\n=====START_PRIMARY_KEYS=====') && chunk.endsWith('=====END_PRIMARY_KEYS=====\n'))
                        {
                            setIsGeneratingGraph(true);
                            const jsonString = chunk.replaceAll('\n=====START_PRIMARY_KEYS=====', '').replaceAll('=====END_PRIMARY_KEYS=====\n', '');
                            const primaryKeys = JSON.parse(jsonString) as PrimaryKeyEntities[];
                            fetch('/search/nodes', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    projectId: projectDetails.id,
                                    primaryKeys,
                                }),
                            })
                                .then(response => response.json())
                                .then((data: {
                                    links: { source: string, target: string }[],
                                    nodes: { id: string, primaryKey: string, dbRelationship: string }[],
                                }) => 
                                {
                                    // we only want to set nodes and links we don't have already.
                                    setGData(gData => 
                                    {
                                        if (!gData)
                                            return data;

                                        const newNodes = data.nodes.filter(node => !gData.nodes.some(n => n.id === node.id));
                                        const newLinks = data.links.filter(link => !gData.links.some(l => l.source === link.source && l.target === link.target));

                                        return {
                                            nodes: [...gData.nodes, ...newNodes],
                                            links: [...gData.links, ...newLinks],
                                        };
                                    });

                                    setIsGeneratingGraph(false);
                                });
                            return [...searchResults, { type: 'ai', content: 'LOADING VISUALISER...\n' }];
                        }
                        
                        return [...searchResults, { type: 'ai', content: chunk }];
                    }
                    else
                    {
                        // add the new chunk to the latest AI response
                        const lastAIResponse = searchResults[searchResults.length - 1];

                        if (chunk.startsWith('\n=====START_PRIMARY_KEYS=====') && chunk.endsWith('=====END_PRIMARY_KEYS=====\n'))
                        {
                            setIsGeneratingGraph(true);
                            const jsonString = chunk.replaceAll('\n=====START_PRIMARY_KEYS=====', '').replaceAll('=====END_PRIMARY_KEYS=====\n', '');
                            const primaryKeys = JSON.parse(jsonString) as PrimaryKeyEntities[];
                            fetch('/search/nodes', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    projectId: projectDetails.id,
                                    primaryKeys,
                                }),
                            })
                                .then(response => response.json())
                                .then((data: {
                                    links: { source: string, target: string }[],
                                    nodes: { primaryKey: string, id: string, dbRelationship: string }[],
                                }) => 
                                {
                                    // we only want to set nodes and links we don't have already.
                                    setGData(gData => 
                                    {
                                        if (!gData)
                                            return data;

                                        const newNodes = data.nodes.filter(node => !gData.nodes.some(n => n.id === node.id));
                                        const newLinks = data.links.filter(link => !gData.links.some(l => l.source === link.source && l.target === link.target));

                                        return {
                                            nodes: [...gData.nodes, ...newNodes],
                                            links: [...gData.links, ...newLinks],
                                        };
                                    });

                                    setIsGeneratingGraph(false);
                                });
                            return [...searchResults.slice(0, searchResults.length - 1), { type: 'ai', content: 'LOADING VISUALISER...\n' }];
                        }
                        
                        return [...searchResults.slice(0, searchResults.length - 1), { type: 'ai', content: lastAIResponse.content + chunk }];
                    }
                });

                // if the user is currently scrolled to the bottom of the results, scroll to the bottom again.
                // if they've scrolled up, don't scroll to the bottom.
                const resultsDiv = searchBarRef.current?.nextElementSibling;
                if (resultsDiv)
                {
                    const scrollBottom = resultsDiv.scrollHeight - resultsDiv.clientHeight - resultsDiv.scrollTop;
                    if (scrollBottom < 100)
                        resultsDiv.scrollTop = resultsDiv.scrollHeight;
                }
            }
            while (!isDone);
    
            console.log('Query successful');
            setErrorText('');
            setSearch('');
        }
        catch (error) 
        {
            console.error(error);
            setErrorText(JSON.stringify(error) || 'Failed to search database');
            notifications.show({ title: 'Error', message: 'Failed to search database', color: 'red' });
        }
        finally 
        {
            setIsSearching(false);
        }
    }


    const handleSearch = (e: React.FormEvent) => 
    {
        e.preventDefault();
        if (!isAnimating) 
        {
            setIsAnimating(true);
            if (searchBarRef.current) 
            {
                searchBarRef.current.style.transition = 'all 500ms ease-out';
                searchBarRef.current.style.transform = 'translateY(calc(50vh - 10px))';
            }
        }

        searchDatabase();
    };


    useEffect(() => 
    {
        const handleTransitionEnd = () => 
        {
            setIsAnimating(false);
            setShowResults(true);
            setTimeout(() => setResultsOpacity(1), 50); // Small delay to ensure state update triggers re-render
        };

        const searchBar = searchBarRef.current;
        if (searchBar)
            searchBar.addEventListener('transitionend', handleTransitionEnd);

        // focus the search input
        const searchInput = document.getElementById('search-database-input');
        if (searchInput)
            searchInput.focus();

        // set the width and height based on visualiser-container
        const visualiserContainer = document.getElementById('visualiser-container');
        if (visualiserContainer)
        {
            setWidth(visualiserContainer.clientWidth);
            setHeight(visualiserContainer.clientHeight);
        }

        // setup a listener for resize to update the width and height
        const handleResize = () => 
        {
            if (visualiserContainer)
            {
                setWidth(visualiserContainer.clientWidth);
                setHeight(visualiserContainer.clientHeight);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => 
        {
            if (searchBar)
                searchBar.removeEventListener('transitionend', handleTransitionEnd);

            window.removeEventListener('resize', handleResize);
        };
    }, []);


    return <div className='flex-grow bg-black flex flex-col items-center justify-center min-h-[calc(100vh-100px)] relative overflow-hidden'>
        <div 
            className='w-full flex-grow h-full flex absolute top-0 left-0'
            style={{ 
                opacity: resultsOpacity,
                transition: 'opacity 500ms ease-in',
                display: showResults ? 'flex' : 'none'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div 
                className='relative bg-black flex flex-col gap-3 p-4 flex-grow max-h-[calc(100%)] overflow-y-auto border-l-[1px] border-y-[1px] border-neutral-700 text-sm'
                style={{ width: `${100 - splitPosition}%` }}
            >
                <div className='flex-grow flex flex-col gap-3'>
                    {
                        searchResults.length === 0 &&
                        <div className='flex-grow flex flex-col gap-3 items-center justify-center'>
                            <Image src={Logo} alt='Supacord Logo' width={50} height={50} />
                            <h4 className='text-center'>Investigate Your Data</h4>
                        </div>
                    }
                    {searchResults.map((result, index) => 
                        result.type === 'user' ? (
                            <div 
                                key={index} 
                                className='w-full p-4 px-8 bg-white text-black rounded-lg shadow-lg whitespace-pre-line'
                            >
                                <b>You Wrote:</b>
                                <br />
                                {result.content}
                            </div>
                        ) : (
                            <div key={index} className="w-full max-w-full">
                                <Markdown
                                    remarkPlugins={[remarkGfm]}
                                    className='markdown prose prose-sm max-w-none'
                                    components={{
                                        code({ className, children, ...props }) 
                                        {
                                            return (
                                                <code
                                                    className={`${className} whitespace-pre-wrap break-words`}
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            );
                                        },
                                        pre({ children, ...props }) 
                                        {
                                            return (
                                                <pre
                                                    className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg p-4"
                                                    {...props}
                                                >
                                                    {children}
                                                </pre>
                                            );
                                        }
                                    }}
                                >
                                    {result.content}
                                </Markdown>
                            </div>
                        )
                    )}
                </div>
                <div
                    ref={searchBarRef}
                    className='w-full flex items-center justify-center sticky bottom-0'
                >
                    <form onSubmit={handleSearch} className='w-full flex flex-col gap-5'>
                        <div className='flex items-start gap-5 bg-primary p-2 rounded-lg'>
                            {
                                !projectDetails &&
                                <Loader size={24} color='white' className='my-3 mr-auto ml-8' />
                            }
                            {
                                projectDetails &&
                            <textarea
                                id='search-database-input'
                                className='text-sm focus:outline-none bg-transparent min-h-[30px] w-full py-2.5 px-2 font-semibold drop-shadow-lg'
                                placeholder={`Search ${projectDetails.databaseName}...`}
                                value={search}
                                disabled={isSearching}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            }
                            <Button disabled={!projectDetails} variant='white' className='min-w-fit' loading={isSearching}
                                onClick={() => search && searchDatabase()}>
                                <Search size={20} />
                            </Button>
                        </div>
                        {
                            errorText &&
                        <Alert variant='filled' color='red'>
                            {errorText}
                        </Alert>
                        }
                    </form>
                </div>
            </div>
            {/* Resizer handle */}
            <div
                className='flex-grow flex flex-col w-1 cursor-col-resize bg-neutral-700 hover:bg-blue-500 active:bg-blue-600 transition-colors max-h-[calc(100%)] z-50'
                onMouseDown={handleMouseDown}
            />
            <div 
                id='visualiser-container'
                className='relative flex flex-col border-r-[1px] border-y-[1px] border-neutral-700 max-h-full'
                style={{ width: `${splitPosition}%` }}
            >
                {
                    searchResults.length === 0 &&
                    <div className='absolute inset-0 flex flex-col items-center justify-center gap-3 z-50'>
                        <Image src={Logo} alt='Supacord Logo' width={50} height={50} />
                        <h4 className='text-center'>
                            Graph will appear when data starts flowing
                        </h4>
                    </div>
                }
                {isGeneratingGraph && (
                    <div className='absolute inset-0 flex flex-col gap-1 items-center justify-center z-50 bg-black bg-opacity-50'>
                        <Loader size={48} color='white' />
                        <h4 className='animate-pulse'>
                            Generating Graph...
                        </h4>
                    </div>
                )}
                <Graph gData={gData} width={width} height={height} />
            </div>
        </div>
    </div>;
}