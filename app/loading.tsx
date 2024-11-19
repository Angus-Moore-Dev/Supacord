'use client';


export default function LoadingPage()
{
    return <div className="flex flex-grow items-center justify-center">
        <div className="container my-24">
            <div className="rectangle rectangle-1"></div>
            <div className="rectangle shadow-rectangle-2"></div>
            <div className="rectangle rectangle-2"></div>
            <div className="rectangle shadow-rectangle-3"></div>
            <div className="rectangle rectangle-3"></div>
            <div className="rectangle shadow-rectangle-4"></div>
        </div>
    </div>;
}