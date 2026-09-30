import React from 'react';
import { MonthlyGoalOverview } from '../types/tracker';
import { TrophyIcon, FlameIcon, SparklesIcon } from './Icons';

interface MonthlyOverviewCardProps {
  overview: MonthlyGoalOverview;
  activeWeekNumber: number;
}

export const MonthlyOverviewCard: React.FC<MonthlyOverviewCardProps> = ({
  overview,
  activeWeekNumber
}) => {
  const { totalMonthlyTarget, totalMonthlyCompleted, progressPercentage, weeklyBreakdown, monthName, year } = overview;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 border border-slate-800/80 shadow-2xl p-5 md:p-6 backdrop-blur-md">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        {/* Left: Summary and Add-on Philosophy */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <TrophyIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cumulative Monthly Goal Architecture</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {monthName} {year} Master Goal
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            <span className="text-emerald-400 font-semibold">Add-on System:</span> Your monthly target is dynamically calculated as the sum of all individual weekly goals ({overview.weeklyBreakdown.length} weeks). Weekly progress continuously accumulates into your monthly milestone.
          </p>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2">
              <span className="text-[11px] font-medium text-slate-400 block">Monthly Target Sum</span>
              <span className="text-lg font-bold text-white font-mono">{totalMonthlyTarget.toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span></span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2">
              <span className="text-[11px] font-medium text-slate-400 block">Logged Add-on</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">{totalMonthlyCompleted.toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span></span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2">
              <span className="text-[11px] font-medium text-slate-400 block">Current Focus</span>
              <span className="text-lg font-bold text-indigo-400 font-mono">Week {activeWeekNumber}</span>
            </div>
          </div>
        </div>

        {/* Right: Radial Progress & Completion Indicator */}
        <div className="flex items-center space-x-6 self-start lg:self-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Radial Ring */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-emerald-400 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * progressPercentage) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {progressPercentage}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                Completed
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400">
              <FlameIcon className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Month Trajectory</span>
            </div>
            <p className="text-xs text-slate-300">
              {totalMonthlyCompleted >= totalMonthlyTarget && totalMonthlyTarget > 0
                ? '🌟 Monthly Goal Fully Achieved!'
                : `${(totalMonthlyTarget - totalMonthlyCompleted).toLocaleString()} units left this month`}
            </p>
            <p className="text-[11px] text-slate-400">
              {weeklyBreakdown.filter(w => w.percentage >= 100).length} of {weeklyBreakdown.length} weeks perfected
            </p>
          </div>
        </div>

      </div>

      {/* Week Breakdown Add-on Timeline */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
          <span className="font-semibold text-slate-300">Weekly Add-on Contributions:</span>
          <span className="font-mono text-slate-400">
            {weeklyBreakdown.map((w) => `W${w.weekNumber}: ${w.percentage}%`).join(' • ')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
          {weeklyBreakdown.map((w) => (
            <div
              key={w.weekNumber}
              className={`p-2.5 rounded-xl border text-xs transition-all ${
                w.weekNumber === activeWeekNumber
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-950/30 border-slate-800/60 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className={w.weekNumber === activeWeekNumber ? 'text-indigo-300' : 'text-slate-300'}>
                  {w.weekLabel}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {w.percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    w.percentage >= 100
                      ? 'bg-emerald-400'
                      : w.weekNumber === activeWeekNumber
                      ? 'bg-indigo-400'
                      : 'bg-slate-500'
                  }`}
                  style={{ width: `${Math.min(100, w.percentage)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>{w.completed}/{w.target}</span>
                {w.isCurrent && <span className="text-emerald-400 font-bold">• Active</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
