'use client';

import { createBrowserClient } from '@/utils/supabaseBrowser';
import { Alert, Button, Loader } from '@mantine/core';
import { Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function VisualiserPage({ params }: { params: { id: string } }) 
{
    const supabase = createBrowserClient();
    const [projectDetails, setProjectDetails] = useState<{ id: string, databaseName: string }>();
    const [loadingError, setLoadingError] = useState('');
    const [search, setSearch] = useState('');

    const [showResults, setShowResults] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const [resultsOpacity, setResultsOpacity] = useState(0);
    const searchBarRef = useRef<HTMLDivElement>(null);

    const handleSearch = (e: React.FormEvent) => 
    {
        e.preventDefault();
        if (!isAnimating) 
        {
            setIsAnimating(true);
            if (searchBarRef.current) 
            {
                searchBarRef.current.style.transition = 'all 500ms ease-out';
                searchBarRef.current.style.transform = 'translateY(calc(50vh - 40px))';
            }
        }
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

        supabase.from('projects').select('id, databaseName').eq('id', params.id).single().then(({ data, error }) =>
        {
            if (error)
            {
                console.log(error);
                setLoadingError(error.message);
            }
            else
                setProjectDetails(data);
        });

        return () => 
        {
            if (searchBar)
                searchBar.removeEventListener('transitionend', handleTransitionEnd);
        };
    }, []);

    return (
        <div className='flex-grow flex flex-col items-center justify-center min-h-[calc(100vh-100px)] relative overflow-hidden'>
            <div 
                className='w-full h-[calc(100vh-80px)] flex absolute top-0 left-0'
                style={{ 
                    opacity: resultsOpacity,
                    transition: 'opacity 500ms ease-in',
                    display: showResults ? 'flex' : 'none'
                }}
            >
                <div className='w-1/2 bg-neutral-900 p-4'>Left Results</div>
                <div className='w-1/2 bg-neutral-800 p-4'>Right Results</div>
            </div>
            <div
                ref={searchBarRef}
                className='w-full flex items-center justify-center z-50 absolute left-0 right-0'
                style={{ 
                    bottom: '50vh',
                    transform: showResults ? 'translateY(calc(50vh - 40px))' : 'translateY(0)',
                    transition: 'transform 500ms ease-out'
                }}
            >
                <form onSubmit={handleSearch} className='w-[60vw] flex flex-col gap-5'>
                    <div className='flex gap-5 bg-black p-2 rounded-full border-[1px] border-neutral-700 shadow-lg items-center px-8 py-4'>
                        {
                            !projectDetails &&
                            <Loader size={24} color='white' className='my-3 mr-auto ml-8' />
                        }
                        {
                            projectDetails &&
                            <input
                                id='search-database-input'
                                className='focus:outline-none bg-transparent w-full py-2.5 px-8 font-semibold text-lg'
                                type='search'
                                placeholder={`Search ${projectDetails.databaseName}...`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        }
                        <Button variant='white' leftSection={<Search size={20} />} className='min-w-fit'>
                            Search DB
                        </Button>
                    </div>
                    {
                        loadingError &&
                        <Alert variant='filled' color='red'>
                            {loadingError}
                        </Alert>
                    }
                </form>
            </div>
        </div>
    );
}