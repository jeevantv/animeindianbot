import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { context } from '@devvit/web/client';

const PollOptions = () => {
    console.log("options screen", context.postData)
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-emerald-600 dark:text-emerald-400 tracking-tight">
                    Poll Options
                </h1>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <p className="text-slate-500 dark:text-slate-400">Poll configuration options will go here.</p>
                </div>
            </div>
        </div>
    )
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PollOptions />
    </StrictMode>
);
