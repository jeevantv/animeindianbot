import { StrictMode, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { context } from '@devvit/web/client';

type PollOption = {
    key: string;
    value: string;
    votes: number;
};

type PollData = {
    options: PollOption[];
    totalVotes: number;
    userVotes: string[];
};

const formatCount = (num: number): string => num.toLocaleString('en-IN');

const getTimeLeft = (expirationTimestamp?: string): string => {
    if (!expirationTimestamp) return '';
    const diff = new Date(expirationTimestamp).getTime() - Date.now();
    if (diff <= 0) return 'Closed';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d left`;
    if (h > 0) return `${h}h left`;
    return `${Math.max(1, m)}m left`;
};

const PollsV2 = () => {
    const [pollData, setPollData] = useState<PollData | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [isModerator, setIsModerator] = useState(false);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const longPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressTriggered = useRef(false);

    const OPTIONS_PER_PAGE = 6;

    const allowMultiple = context.postData?.allowMultipleVotes as boolean | undefined;
    const expirationTimestamp = context.postData?.expirationTimestamp as string | undefined;

    useEffect(() => {
        if (!expirationTimestamp) return;
        const tick = () => setTimeLeft(getTimeLeft(expirationTimestamp));
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, [expirationTimestamp]);

    useEffect(() => {
        if (!activeTooltip) return;
        const timer = setTimeout(() => setActiveTooltip(null), 4000);
        return () => clearTimeout(timer);
    }, [activeTooltip]);

    const fetchPollData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/polls/data');
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? 'Failed to load poll');
            setPollData(json.items);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load poll');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPollData();
        fetch('/api/polls/isMod')
            .then(r => r.json())
            .then(json => {
                if (json && json.items && json.items.isModerator) {
                    setIsModerator(true);
                }
            })
            .catch(() => {});
    }, []);

    const options = pollData?.options ?? [];
    const totalPages = Math.max(1, Math.ceil(options.length / OPTIONS_PER_PAGE));
    const paginatedOptions = options.slice(
        currentPage * OPTIONS_PER_PAGE,
        (currentPage + 1) * OPTIONS_PER_PAGE
    );

    const hasVoted = (pollData?.userVotes?.length ?? 0) > 0;
    const isClosed = expirationTimestamp ? new Date() > new Date(expirationTimestamp) : false;
    const showResults = hasVoted || isClosed;

    const handlePressStart = (key: string) => {
        isLongPressTriggered.current = false;
        if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
        longPressTimeout.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            setActiveTooltip(key);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(25); } catch { /* ignore */ }
            }
        }, 400);
    };

    const handlePressCancel = () => {
        if (longPressTimeout.current) {
            clearTimeout(longPressTimeout.current);
            longPressTimeout.current = null;
        }
    };

    const handleOptionClick = (key: string) => {
        handlePressCancel();
        if (isLongPressTriggered.current) {
            isLongPressTriggered.current = false;
            return;
        }
        if (showResults) {
            setActiveTooltip(prev => (prev === key ? null : key));
            return;
        }
        if (allowMultiple) {
            setSelected(prev =>
                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
            );
        } else {
            setSelected([key]);
        }
    };

    const submitVote = async () => {
        if (selected.length === 0) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/polls/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ optionKeys: selected }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? 'Failed to cast vote');
            setSelected([]);
            await fetchPollData();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to cast vote');
        } finally {
            setSubmitting(false);
        }
    };

    const resetPoll = async () => {
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/polls/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? 'Failed to reset poll');
            setSelected([]);
            await fetchPollData();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to reset poll');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col justify-between min-h-screen bg-[#0f0f10] text-slate-100 font-sans p-4 select-none">
            <div className="max-w-xl w-full mx-auto flex flex-col gap-3">

                <div className="flex items-center justify-between gap-2 w-full my-0.5">
                    <div className="grid grid-cols-2 gap-2 w-32">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(0, prev -1))}
                            disabled={currentPage === 0}
                            className="flex items-center justify-center h-8 rounded-full bg-[#1e1e20] hover:bg-[#28282b] disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-colors text-slate-300"
                            title="Previous page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="flex items-center justify-center h-8 rounded-full bg-[#1e1e20] hover:bg-[#28282b] disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-colors text-slate-300"
                            title="Next page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                    {allowMultiple && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                            Multi-vote
                        </span>
                    )}
                </div>

                {error && (
                    <div className="px-3 py-2 rounded-xl bg-red-900/30 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex flex-col gap-2.5">
                    {loading ? (
                        Array.from({ length: OPTIONS_PER_PAGE }).map((_, i) => (
                            <div key={i} className="h-12 rounded-xl bg-[#1a1a1c] animate-pulse border border-white/5" />
                        ))
                    ) : (
                        paginatedOptions.map((option) => {
                            const pct = (pollData && pollData.totalVotes > 0)
                                ? Math.round((option.votes / pollData.totalVotes) * 100)
                                : 0;
                            const isSelected = selected.includes(option.key);
                            const isUserVoted = pollData?.userVotes.includes(option.key);

                            const isTooltipOpen = activeTooltip === option.key;
                            const tooltipContent = showResults
                                ? `${formatCount(option.votes)} ${option.votes === 1 ? 'vote' : 'votes'} (${pct}%) · ${option.value}`
                                : option.value;

                            return (
                                <div key={option.key} className="relative">
                                    {isTooltipOpen && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveTooltip(null);
                                            }}
                                            className="absolute left-2 right-2 bottom-full mb-1.5 z-50 bg-white text-slate-900 px-3 py-2 rounded-xl text-xs font-bold shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 cursor-pointer max-h-36 overflow-y-auto"
                                        >
                                            <div className="break-words whitespace-normal leading-relaxed">{tooltipContent}</div>
                                        </div>
                                    )}
                                    <div
                                        title={showResults ? `${formatCount(option.votes)} ${option.votes === 1 ? 'vote' : 'votes'} · ${option.value}` : option.value}
                                        onMouseEnter={() => setActiveTooltip(option.key)}
                                        onMouseLeave={() => {
                                            handlePressCancel();
                                            if (activeTooltip === option.key) setActiveTooltip(null);
                                        }}
                                        onTouchStart={() => handlePressStart(option.key)}
                                        onTouchEnd={handlePressCancel}
                                        onTouchMove={handlePressCancel}
                                        onMouseDown={() => handlePressStart(option.key)}
                                        onMouseUp={handlePressCancel}
                                        onClick={() => handleOptionClick(option.key)}
                                        className={[
                                            'relative flex items-center justify-between px-4 h-12 rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer',
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-950/40'
                                                : isUserVoted
                                                    ? 'border-emerald-500/60 bg-emerald-950/30'
                                                    : 'border-white/5 bg-[#1a1a1c] hover:border-white/20'
                                        ].join(' ')}
                                    >
                                        {showResults && (
                                            <div
                                                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-700 ease-out z-0"
                                                style={{ width: `${Math.max(pct, 2)}%` }}
                                            />
                                        )}

                                        <div className="relative z-10 flex items-center gap-2.5 min-w-0 pr-2">
                                            {!showResults && (
                                                <span className={[
                                                    'w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0',
                                                    isSelected
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'border-white/30 bg-transparent'
                                                ].join(' ')}>
                                                    {isSelected && (
                                                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8 15.414l-4.707-4.707a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </span>
                                            )}
                                            <span className={['text-sm font-medium text-white', isSelected ? 'break-words whitespace-normal py-1' : 'truncate'].join(' ')}>
                                                {option.value}
                                            </span>
                                        </div>

                                        {showResults && (
                                            <div className="relative z-10 flex items-center gap-3 shrink-0 pl-2">
                                                <span className="text-xs text-emerald-200/80 font-normal">
                                                    {formatCount(option.votes)} {option.votes === 1 ? 'vote' : 'votes'}
                                                </span>
                                                <span className="text-sm font-bold text-white tabular-nums w-12 text-right">
                                                    {pct}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {!loading && !showResults && (
                    <button
                        disabled={selected.length === 0 || submitting}
                        onClick={submitVote}
                        className="mt-1 w-full h-11 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg transition-all"
                    >
                        {submitting ? 'Casting Vote...' : `Vote ${selected.length > 0 ? `(${selected.length})` : ''}`}
                    </button>
                )}
            </div>

            <div className="max-w-xl w-full mx-auto mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1e1e20] border border-white/5 text-slate-300">
                        {timeLeft}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-300">
                        {pollData ? `${pollData.totalVotes.toLocaleString('en-IN')} votes` : '0 votes'}
                    </span>
                    {!loading && isModerator && (
                        <button
                            onClick={resetPoll}
                            disabled={submitting}
                            title="Reset all votes on this poll (Moderator only)"
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1e1e20] hover:bg-red-950/60 border border-white/10 hover:border-red-500/50 text-slate-300 hover:text-red-300 transition-all cursor-pointer shrink-0"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PollsV2 />
    </StrictMode>
);
