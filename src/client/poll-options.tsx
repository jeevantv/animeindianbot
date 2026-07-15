import { StrictMode, useEffect, useState, Activity } from 'react';
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

const getTimeLeft = (expirationTimestamp: string): string => {
    const diff = new Date(expirationTimestamp).getTime() - Date.now();
    if (diff <= 0) return 'Closed';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    if (d > 0) return `Closes in ${d} day${d !== 1 ? 's' : ''}`;
    return `Closes in ${h} hour${h !== 1 ? 's' : ''}`;
};

const PollOptions = () => {
    const [pollData, setPollData] = useState<PollData | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState('');

    const allowMultiple = context.postData?.allowMultipleVotes as boolean | undefined;
    const expirationTimestamp = context.postData?.expirationTimestamp as string | undefined;

    useEffect(() => {
        if (!expirationTimestamp) return;
        const tick = () => setTimeLeft(getTimeLeft(expirationTimestamp));
        tick();
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, [expirationTimestamp]);

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

    useEffect(() => { fetchPollData(); }, []);

    const hasVoted = (pollData?.userVotes?.length ?? 0) > 0;
    const isClosed = expirationTimestamp ? new Date() > new Date(expirationTimestamp) : false;
    const showResults = hasVoted || isClosed;

    const toggleSelect = (key: string) => {
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
            if (json.success) {
                setSelected([]);
                await fetchPollData();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to cast vote');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f10] text-slate-900 dark:text-slate-100 font-sans">
            <div className="max-w-xl mx-auto px-3 py-4">

                <div className="flex items-center justify-between mb-5 px-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {timeLeft || (isClosed ? 'Closed' : 'Loading...')}
                    </span>
                    <span className="text-sm font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {pollData ? `${pollData.totalVotes} vote${pollData.totalVotes !== 1 ? 's' : ''}` : '—'}
                    </span>
                </div>

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }, (_, i) => (
                            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
                                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-700 rounded-full mb-3" />
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && pollData && (
                    <div className="space-y-3">
                        {pollData.options.map((option) => {
                            const pct = pollData.totalVotes > 0
                                ? Math.round((option.votes / pollData.totalVotes) * 100)
                                : 0;
                            const isUserVoted = pollData.userVotes.includes(option.key);
                            const isSelected = selected.includes(option.key);
                            const isClickable = !showResults && !isClosed;

                            return (
                                <div
                                    key={option.key}
                                    onClick={() => isClickable && toggleSelect(option.key)}
                                    className={[
                                        'relative rounded-2xl border-2 p-4 transition-all duration-200 select-none',
                                        isClickable ? 'cursor-pointer' : 'cursor-default',
                                        isSelected
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]'
                                            : isUserVoted
                                                ? 'border-emerald-400 dark:border-emerald-700 bg-white dark:bg-slate-900'
                                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700',
                                    ].join(' ')}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {isClickable && (
                                                <span className={[
                                                    'shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-200',
                                                    isSelected
                                                        ? 'border-emerald-500 bg-emerald-500'
                                                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800',
                                                ].join(' ')}>
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8 15.414l-4.707-4.707a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </span>
                                            )}
                                            <span className={`text-sm leading-snug break-words ${isUserVoted ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                                {option.value}
                                            </span>
                                        </div>
                                        {showResults && (
                                            <div className="shrink-0 flex items-center gap-1.5">
                                                {isUserVoted && (
                                                    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                <span className={`text-sm font-bold tabular-nums ${isUserVoted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                    {pct}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ease-out ${isUserVoted
                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                            style={{ width: showResults ? `${Math.max(pct, 1)}%` : '0%' }}
                                        />
                                    </div>

                                    {showResults && (
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                            {option.votes} vote{option.votes !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            );
                        })}

                        <Activity mode={!showResults && !isClosed ? "visible" : "hidden"}>
                            <button
                                disabled={selected.length === 0 || submitting}
                                onClick={submitVote}
                                className="mt-1 w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] hover:scale-[1.01] active:scale-[0.99] transform transition-all duration-200"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Submitting…
                                    </span>
                                ) : 'Cast Vote →'}
                            </button>
                        </Activity>

                        <Activity mode={showResults || isClosed ? "visible" : "hidden"}>
                            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1 py-2">
                                {isClosed ? 'This poll is closed' : "You've already voted on this poll"}
                            </p>
                        </Activity>
                    </div>
                )}
            </div>
        </div>
    );
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PollOptions />
    </StrictMode>
);
