import React from 'react';
import { GoalItem, MonthModel, MonthlyGoalOverview } from '../types/tracker';
import { CloseIcon, HistoryIcon, TrophyIcon, SparklesIcon, CheckIcon } from './Icons';
import { formatWeekRange } from '../utils/calendarEngine';

interface PastWeeksHistoryModalProps {
  month: MonthModel;
  overview: MonthlyGoalOverview;
  weeklyGoalsMap: Record<string, GoalItem[]>;
  onClose: () => void;
  onSelectWeekToView: (weekId: string) => void;
}

export const PastWeeksHistoryModal: React.FC<PastWeeksHistoryModalProps> = ({
  month,
  overview,
  weeklyGoalsMap,
  onClose,
  onSelectWeekToView
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Historical Weeks & Cumulative Progress
              </h3>
              <p className="text-xs text-slate-400">
                Review past weeks’ data and monitor how each week built up the {month.monthName} {month.year} master goal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Master Summary Banner */}
        <div className="p-6 bg-gradient-to-r from-violet-950/30 via-slate-950 to-indigo-950/30 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-violet-400 uppercase tracking-wider mb-1">
                <TrophyIcon className="w-4 h-4 text-violet-400" />
                <span>Month Total Add-on Progress</span>
              </div>
              <h4 className="text-2xl font-bold text-white">
                {overview.totalMonthlyCompleted} / {overview.totalMonthlyTarget} Units
              </h4>
              <p className="text-xs text-slate-400">
                Aggregated from all {month.weeksCount} weeks across {month.monthName}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {overview.progressPercentage}%
                </span>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                  Overall Completion
                </span>
              </div>
            </div>
          </div>

          {/* Continuous Cumulative Progress Line */}
          <div className="mt-4 w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
            {overview.weeklyBreakdown.map((w, idx) => {
              const portionOfTotal = overview.totalMonthlyTarget > 0 ? (w.target / overview.totalMonthlyTarget) * 100 : 0;
              const completedPortion = overview.totalMonthlyTarget > 0 ? (w.completed / overview.totalMonthlyTarget) * 100 : 0;
              const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-sky-500', 'bg-amber-500', 'bg-rose-500'];

              return (
                <div
                  key={w.weekNumber}
                  style={{ width: `${portionOfTotal}%` }}
                  className="h-full border-r border-slate-950 relative group"
                  title={`${w.weekLabel}: ${w.completed}/${w.target} (${w.percentage}%)`}
                >
                  <div
                    style={{ width: `${Math.min(100, w.percentage)}%` }}
                    className={`h-full ${colors[idx % colors.length]}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Start of Month</span>
            <span>Week Rollovers</span>
            <span>Month Target</span>
          </div>
        </div>

        {/* Detailed Week-by-Week Cards */}
        <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
          {month.weeks.map((week) => {
            const goals = weeklyGoalsMap[week.id] || [];
            const breakdown = overview.weeklyBreakdown.find(b => b.weekNumber === week.weekNumber);
            const target = breakdown?.target || 0;
            const completed = breakdown?.completed || 0;
            const percentage = breakdown?.percentage || 0;

            return (
              <div
                key={week.id}
                className={`p-4 rounded-2xl border transition-all ${
                  week.isCurrentWeek
                    ? 'bg-indigo-950/20 border-indigo-500/40'
                    : week.isPastWeek
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-slate-950/30 border-slate-900 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-base">
                        {week.label}
                      </span>
                      {week.isCurrentWeek && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          CURRENT SPRINT
                        </span>
                      )}
                      {week.isPastWeek && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                          COMPLETED SPRINT
                        </span>
                      )}
                      {week.isFutureWeek && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/50 text-slate-500">
                          UPCOMING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatWeekRange(week)} • {week.totalActiveDays} Active Days (Mon-Sat)
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-white">
                        {completed} / {target} units
                      </span>
                      <span className="block text-[10px] font-mono text-emerald-400">
                        {percentage}% achieved
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectWeekToView(week.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 hover:text-white"
                    >
                      View on Board
                    </button>
                  </div>
                </div>

                {/* Individual Goals inside this week */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {goals.map((g) => {
                    const goalCompleted = Object.values(g.completed || {}).reduce((a, b) => a + b, 0);
                    const isGoalDone = goalCompleted >= g.weeklyTarget;

                    return (
                      <div
                        key={g.id}
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-200 truncate">{g.title}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {goalCompleted} / {g.weeklyTarget} {g.unit}
                          </span>
                        </div>
                        {isGoalDone ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">
                            {Math.round((goalCompleted / g.weeklyTarget) * 100)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
          >
            Close History
          </button>
        </div>

      </div>
    </div>
  );
};
