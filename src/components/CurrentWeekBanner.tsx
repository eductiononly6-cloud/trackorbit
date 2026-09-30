import React from 'react';
import { WeekModel } from '../types/tracker';
import { formatWeekRange } from '../utils/calendarEngine';
import { ClockIcon, EditIcon, SparklesIcon, TargetIcon } from './Icons';

interface CurrentWeekBannerProps {
  week: WeekModel;
  targetSum: number;
  completedSum: number;
  progressPercentage: number;
  onEditGoals: () => void;
  isViewingLiveCurrentWeek: boolean;
}

export const CurrentWeekBanner: React.FC<CurrentWeekBannerProps> = ({
  week,
  targetSum,
  completedSum,
  progressPercentage,
  onEditGoals,
  isViewingLiveCurrentWeek
}) => {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-indigo-500/30 p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        
        {/* Title and Rollover info */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {week.label}
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {formatWeekRange(week)}
            </span>
            {isViewingLiveCurrentWeek ? (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ClockIcon className="w-3 h-3" />
                <span>Live Active Week (Rolls over Mon 00:00)</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Viewing Week Mode
              </span>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Weekly Goal Target Split</span>
            <span className="text-sm font-normal text-slate-400 font-mono">
              ({week.totalActiveDays} Active Days: Mon-Sat)
            </span>
          </h3>

          <p className="text-xs text-slate-400 mt-0.5">
            Tasks below are split into daily actionable checkpoints. Sundays are designated as strictly off / rest days.
          </p>
        </div>

        {/* Progress & Quick Customize Button */}
        <div className="flex items-center space-x-4 self-start md:self-auto">
          {/* Week Progress Bar & Metric */}
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2">
              <span className="text-xs text-slate-400 font-medium">Week Completion:</span>
              <span className="text-lg font-bold text-white font-mono">{progressPercentage}%</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {completedSum} / {targetSum} units achieved
            </div>
            <div className="w-36 sm:w-44 bg-slate-950/80 h-2 rounded-full overflow-hidden mt-1.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercentage >= 100 ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              />
            </div>
          </div>

          {/* Edit Goals button */}
          <button
            onClick={onEditGoals}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            title="Customize goals for this specific week"
          >
            <EditIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Set Goals</span>
          </button>
        </div>

      </div>
    </div>
  );
};
