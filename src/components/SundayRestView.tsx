import React from 'react';
import { WeekModel } from '../types/tracker';
import { CoffeeIcon, MoonIcon, SparklesIcon, SunIcon, TrophyIcon, CloseIcon } from './Icons';

interface SundayRestViewProps {
  week: WeekModel;
  weeklyTarget: number;
  weeklyCompleted: number;
  weeklyProgress: number;
  onClose?: () => void;
  isTodaySunday: boolean;
}

export const SundayRestView: React.FC<SundayRestViewProps> = ({
  week,
  weeklyTarget,
  weeklyCompleted,
  weeklyProgress,
  onClose,
  isTodaySunday
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-950 border border-amber-500/30 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Close if modal/overlay */}
      {onClose && (
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
        
        {/* Badge & Icon */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wider uppercase">
          <CoffeeIcon className="w-4 h-4 text-amber-400" />
          <span>Sunday Protocol // Strictly Off & Rest Day</span>
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {isTodaySunday ? "Today is Your Rest Day" : "Sunday Sanctuary"}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            No active goals tracking required today. By design, our 6-day sprint (Monday to Saturday) is complete. Sundays are strictly reserved for complete physical & mental rejuvenation.
          </p>
        </div>

        {/* Weekly Sprint Performance Recap Card */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 text-left grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-inner">
          <div className="border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-xs text-slate-400 block font-medium">Sprint Period</span>
            <span className="text-base font-bold text-white block mt-0.5">{week.label}</span>
            <span className="text-[11px] text-slate-400 font-mono">Mon – Sat</span>
          </div>

          <div className="border-b sm:border-b-0 sm:border-r border-slate-800/80 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-xs text-slate-400 block font-medium">Sprint Achieved</span>
            <span className="text-base font-bold text-emerald-400 block mt-0.5 font-mono">
              {weeklyCompleted} / {weeklyTarget} units
            </span>
            <span className="text-[11px] text-slate-400">Added to Monthly Goal</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Sprint Completion</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xl font-extrabold text-white font-mono">{weeklyProgress}%</span>
              {weeklyProgress >= 100 && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  PERFECT
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">Rest earned</span>
          </div>
        </div>

        {/* Mindful Suggestions for Rest Day */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recommended Sunday Rest Rituals
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <SunIcon className="w-4 h-4 text-amber-400 mb-1.5" />
              <p className="font-semibold text-white">Nature Walk</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Unplug and stroll outside without screens.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <CoffeeIcon className="w-4 h-4 text-emerald-400 mb-1.5" />
              <p className="font-semibold text-white">Mindful Meals</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Cook nutritious food and dine unhurried.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <SparklesIcon className="w-4 h-4 text-indigo-400 mb-1.5" />
              <p className="font-semibold text-white">Inspire Mind</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Read fiction, listen to music, or reflect.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <MoonIcon className="w-4 h-4 text-violet-400 mb-1.5" />
              <p className="font-semibold text-white">Deep Sleep</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Early bedtime to fuel next week's energy.</p>
            </div>
          </div>
        </div>

        {/* Rollover notice */}
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
          <p>
            ⚡ <strong>Dynamic Rollover:</strong> At midnight tonight (00:00 Monday), the app will automatically roll over to the next week's goals and start tracking active days afresh!
          </p>
        </div>

      </div>
    </div>
  );
};
