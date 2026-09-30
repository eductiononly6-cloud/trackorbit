import React from 'react';
import { WeekModel } from '../types/tracker';
import { formatWeekRange } from '../utils/calendarEngine';
import { SparklesIcon } from './Icons';

interface WeekTabsProps {
  weeks: WeekModel[];
  selectedWeekId: string;
  onSelectWeek: (weekId: string) => void;
  weeklyProgressMap: Record<string, number>;
}

export const WeekTabs: React.FC<WeekTabsProps> = ({
  weeks,
  selectedWeekId,
  onSelectWeek,
  weeklyProgressMap
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Month Calendar Split ({weeks.length} Weeks calculated)
        </h3>
        <span className="text-[11px] text-slate-400">
          Mon – Sat Active • Sun Rest
        </span>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {weeks.map((week) => {
          const isSelected = week.id === selectedWeekId;
          const progress = weeklyProgressMap[week.id] || 0;

          return (
            <button
              key={week.id}
              onClick={() => onSelectWeek(week.id)}
              className={`flex-1 min-w-[140px] max-w-[220px] text-left p-3 rounded-xl border transition-all duration-200 relative ${
                isSelected
                  ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10 text-white'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700 text-slate-300'
              }`}
            >
              {week.isCurrentWeek && (
                <span className="absolute top-2 right-2 flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>CURRENT</span>
                </span>
              )}

              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold tracking-tight">
                  {week.label}
                </span>
                {progress >= 100 && (
                  <span className="text-emerald-400 text-xs">✓</span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {formatWeekRange(week)}
              </p>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                <span>{week.totalActiveDays} days (Mon-Sat)</span>
                <span className="font-mono font-semibold text-slate-300">{progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="mt-1 w-full bg-slate-950/80 h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progress >= 100
                      ? 'bg-emerald-400'
                      : isSelected
                      ? 'bg-indigo-400'
                      : 'bg-slate-600'
                  }`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
