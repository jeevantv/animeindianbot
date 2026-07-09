import { context, requestExpandedMode } from '@devvit/web/client'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const PollSplash = () => {
    console.log("Splash screen", context.postData)
    return (
        <div className="flex relative flex-col justify-center items-center min-h-screen bg-slate-50 text-slate-900 dark:bg-gradient-to-br dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900 dark:text-white overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-200 dark:bg-emerald-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 dark:opacity-40 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-200 dark:bg-teal-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-60 dark:opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="z-10 flex flex-col items-center gap-8 w-full max-w-md p-10 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-xl dark:shadow-2xl border border-slate-200 dark:border-white/10">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-50 dark:opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <img
                        className="relative flex items-center justify-center text-center p-4 text-sm text-slate-500 dark:text-slate-400 italic object-cover w-32 h-32 rounded-full border-2 border-white/80 dark:border-white/20 shadow-xl bg-slate-100 dark:bg-slate-800"
                        src={context.snoovatar}
                        alt="snoovatar"
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                <div className="flex flex-col items-center gap-2 w-full">
                    <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300 text-center mt-2">
                        Hey {context?.username ?? 'there'} 👋
                    </h2>
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-3 font-light leading-relaxed">
                        {context.postData?.body as string}
                    </p>
                </div>

                <div className="w-full mt-6">
                    <button
                        className="relative flex w-full items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white h-14 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:scale-[1.02] transform transition-all duration-300"
                        onClick={(e) => requestExpandedMode(e.nativeEvent, 'poll-options')}
                    >
                        Participate in poll
                    </button>
                </div>
            </div>
        </div>
    );
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PollSplash />
    </StrictMode>
);