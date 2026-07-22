import { useState, useEffect, StrictMode } from "react"
import { createRoot } from 'react-dom/client';
import { showToast, navigateTo } from '@devvit/web/client';
import './index.css'

interface scheduleRows {
    airingAt: string
    delayedByMins?: string
    scheduledPostAt?: string
    canceled: string
    countryOfOrigin: string
    episodeNumber: string
    format: string
    jobId: string
    popularity: string
    redditJobId: string
    titleEnglish: string
    titleRomaji: string
}

export const EpisodeScheduleDashbord = () => {
    const [rows, setRows] = useState<scheduleRows[]>([])
    const [isLoading, setIsLoading] = useState(true);
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
    const [detailsMap, setDetailsMap] = useState<Record<string, any>>({});
    const [isLoadingDetails, setIsLoadingDetails] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchData()
    }, [])
    const fetchData = async () => {
        try {
            const res = await fetch('/api/epsiodeDashbord')
            const data = await res.json();
            if (data.success) {
                setRows(data.items)
            }
        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    }

    const toggleDetails = async (jobId: string) => {
        if (expandedJobId === jobId) {
            setExpandedJobId(null);
            return;
        }
        setExpandedJobId(jobId);

        if (!detailsMap[jobId]) {
            setIsLoadingDetails(prev => ({ ...prev, [jobId]: true }));
            try {
                // jobId format is usually jobId-12345-1, extract the mediaId
                const mediaId = jobId.split('-')[1];
                const res = await fetch(`/api/episodeDetails?mediaId=${mediaId}`);
                const data = await res.json();
                if (data.success) {
                    setDetailsMap(prev => ({ ...prev, [jobId]: data.items }));
                }
            } catch (error) {
                console.error("Error fetching episode details", error);
            } finally {
                setIsLoadingDetails(prev => ({ ...prev, [jobId]: false }));
            }
        }
    }

    const handleCancel = async (jobId: string) => {
        try {

            const res = await fetch('/api/cancelJob', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            });
            const data = await res.json();

            if (!data.success) {
                showToast('Job not cancelled')
            } else {
                console.log("Job cancelled successfully", data)
                showToast('Job cancelled successfully')
                fetchData()
            }
        } catch (error) {
            console.error("Error cancelling job", error)
            showToast({ text: "Job not cancelled", appearance: 'neutral' })
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-indigo-600 dark:text-indigo-400 tracking-tight">
                    Scheduled Episodes
                </h1>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }, (_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
                                <div className="bg-slate-200 dark:bg-slate-700 h-1.5 w-full"></div>
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : rows.length === 0 ? (
                    <div className="flex justify-center items-center h-64 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <p className="text-lg">No episodes scheduled currently.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                        {rows.map((row, index) => (
                            <div key={index} className="flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                                <div className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 h-1.5 w-full shrink-0"></div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-4 gap-2">
                                        <h3 className="font-bold text-lg leading-tight line-clamp-2" title={row.titleEnglish !== "English Name N/A" ? row.titleEnglish : row.titleRomaji}>
                                            {`${row.titleEnglish} | ${row.titleRomaji}`}
                                        </h3>
                                        <span className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
                                            EP {row.episodeNumber}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4 flex-grow">
                                        <div className="flex flex-col text-sm text-slate-600 dark:text-slate-400 gap-1">
                                            <span><strong>Airing:</strong> {row.airingAt} IST</span>
                                            {row.delayedByMins && row.delayedByMins !== "0" && row.delayedByMins !== "NaN" && (
                                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                                    <strong>Posting:</strong> {row.scheduledPostAt} IST (+{row.delayedByMins}m delay)
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                            <span>{row.countryOfOrigin} &bull; {row.format}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                            <span>Popularity: {row.popularity}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500 dark:text-slate-500 truncate pr-4 font-mono">
                                                {row.redditJobId}
                                            </span>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button onClick={() => toggleDetails(row.jobId)} className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-md transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer">
                                                    {expandedJobId === row.jobId ? 'Hide Details' : 'Details'}
                                                </button>
                                                {row.canceled !== "1" ? (
                                                    <>
                                                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-md uppercase tracking-wider">Active</span>
                                                        <button onClick={() => handleCancel(row.redditJobId)} className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-md transition-colors border border-slate-200 dark:border-slate-600 hover:border-red-200 dark:hover:border-red-800/50 cursor-pointer">
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold rounded-md uppercase tracking-wider">Canceled</span>
                                                )}
                                            </div>
                                        </div>

                                        {expandedJobId === row.jobId && (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-sm mt-2 border border-slate-200 dark:border-slate-700 transition-all">
                                                {isLoadingDetails[row.jobId] ? (
                                                    <div className="flex justify-center items-center py-4">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                                                    </div>
                                                ) : detailsMap[row.jobId] ? (
                                                    <div className="space-y-4">
                                                        {detailsMap[row.jobId].externalLinks?.filter((l: any) => l.type === 'STREAMING' && !l.isDisabled).length > 0 && (
                                                            <div>
                                                                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs uppercase tracking-wider">Watch Here</h4>
                                                                <ul className="space-y-1">
                                                                    {detailsMap[row.jobId].externalLinks.filter((l: any) => l.type === 'STREAMING' && !l.isDisabled).map((link: any, i: number) => (
                                                                        <li key={i}><button onClick={() => navigateTo(link.url)} className="text-indigo-600 dark:text-indigo-400 hover:underline text-left cursor-pointer">{link.site}</button></li>))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {detailsMap[row.jobId].externalLinks?.filter((l: any) => l.type === 'INFO' && !l.isDisabled).length > 0 && (
                                                            <div>
                                                                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs uppercase tracking-wider">Information</h4>
                                                                <ul className="space-y-1">
                                                                    {detailsMap[row.jobId].externalLinks.filter((l: any) => l.type === 'INFO' && !l.isDisabled).map((link: any, i: number) => (
                                                                        <li key={i}><a href={link.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{link.site}</a></li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {(!detailsMap[row.jobId].externalLinks || detailsMap[row.jobId].externalLinks.length === 0) && (
                                                            <p className="text-slate-500 italic">No external links found.</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-red-500 text-sm">Failed to load details.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <EpisodeScheduleDashbord />
    </StrictMode>
);