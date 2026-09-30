import React from 'react';
import { CalendarDay, GoalItem, WeekModel } from '../types/tracker';
import { CheckIcon, PlusIcon, MinusIcon, CoffeeIcon, FlameIcon, SparklesIcon, MoonIcon } from './Icons';

interface DailyTaskBoardProps {
  week: WeekModel;
  goals: GoalItem[];
  simulatedDate: Date;
  onUpdateProgress: (goalId: string, dateString: string, newCompletedValue: number) => void;
  onSelectSundayRest: () => void;
}

export const DailyTaskBoard: React.FC<DailyTaskBoardProps> = ({
  week,
  goals,
  simulatedDate,
  onUpdateProgress,
  onSelectSundayRest
}) => {
  const activeDays = week.activeDays;
  const sunday = week.sundayDate;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Daily Actionable Targets</span>
            <span className="text-xs font-medium text-slate-400">
              (Monday – Saturday Active Tracking)
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Log your daily progress. Each completed unit directly contributes to this week and the cumulative monthly goal.
          </p>
        </div>
      </div>

      {/* Grid of days (Mon - Sat + Sun Rest Day) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeDays.map((day) => {
          const isToday = day.isToday;
          const dayDateStr = day.dateString;
          const formattedDate = day.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          // Check overall completion for this day
          const dayGoals = goals.filter(g => (g.dailyTargets[dayDateStr] ?? 0) > 0);
          const completedCount = dayGoals.filter(g => (g.completed[dayDateStr] ?? 0) >= (g.dailyTargets[dayDateStr] ?? 0)).length;
          const isAllDone = dayGoals.length > 0 && completedCount === dayGoals.length;

          return (
            <div
              key={dayDateStr}
              className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isToday
                  ? 'bg-slate-900/90 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                  : isAllDone
                  ? 'bg-slate-950/60 border-emerald-500/30'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
              } p-4`}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white tracking-tight">
                      {day.dayName}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formattedDate}
                    </span>
                  </div>

                  {isToday ? (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span>TODAY</span>
                    </span>
                  ) : day.isPast ? (
                    <span className="text-[10px] font-medium text-slate-400">
                      Past Day
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-slate-400">
                      Upcoming
                    </span>
                  )}
                </div>

                {/* Day Summary Mini Bar */}
                <div className="py-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {completedCount}/{dayGoals.length} tasks done
                  </span>
                  {isAllDone && (
                    <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                      <SparklesIcon className="w-3 h-3 text-emerald-400" />
                      <span>100% Target Met</span>
                    </span>
                  )}
                </div>

                {/* Actionable Tasks List for this day */}
                <div className="space-y-2.5 mt-1">
                  {goals.map((goal) => {
                    const target = goal.dailyTargets[dayDateStr] ?? 0;
                    const completed = goal.completed[dayDateStr] ?? 0;
                    const isDone = target > 0 ? completed >= target : false;

                    if (target <= 0) return null; // No target scheduled for this specific day

                    return (
                      <div
                        key={goal.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">
                              {goal.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-[11px] font-mono text-slate-400">
                                Target: {target} {goal.unit}
                              </span>
                              <span
                                className={`text-[11px] font-mono font-bold ${
                                  isDone ? 'text-emerald-400' : 'text-indigo-400'
                                }`}
                              >
                                Done: {completed}
                              </span>
                            </div>
                          </div>

                          {/* Quick Toggle / Checkbox */}
                          <button
                            onClick={() => {
                              onUpdateProgress(goal.id, dayDateStr, isDone ? 0 : target);
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isDone
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                            title={isDone ? 'Mark Incomplete' : 'Mark Target Completed'}
                          >
                            <CheckIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Increment / Decrement Stepper */}
                        <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between">
                          <div className="w-20 bg-slate-900 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isDone ? 'bg-emerald-400' : 'bg-indigo-400'
                              }`}
                              style={{
                                width: `${Math.min(100, target > 0 ? (completed / target) * 100 : 0)}%`
                              }}
                            />
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                onUpdateProgress(goal.id, dayDateStr, Math.max(0, completed - 1));
                              }}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                              title="Decrease"
                            >
                              <MinusIcon className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[10px] font-mono px-1 font-semibold text-slate-300">
                              {completed}
                            </span>
                            <button
                              onClick={() => {
                                onUpdateProgress(goal.id, dayDateStr, completed + 1);
                              }}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                              title="Increase"
                            >
                              <PlusIcon className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day footer */}
              <div className="mt-3 pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/50">
                <span>Active Track Day</span>
                <span className="font-mono">{dayDateStr}</span>
              </div>
            </div>
          );
        })}

        {/* SUNDAY CARD - Strictly Rest / Off Day */}
        <div
          onClick={onSelectSundayRest}
          className={`rounded-2xl border transition-all duration-300 cursor-pointer p-4 flex flex-col justify-between ${
            sunday?.isToday
              ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40'
              : 'bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-950 border-dashed border-amber-500/30 hover:border-amber-500/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-amber-500/20">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-amber-300">
                  Sunday
                </span>
                <span className="text-xs text-amber-400/70 font-mono">
                  {sunday ? sunday.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Off Day'}
                </span>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                REST DAY
              </span>
            </div>

            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <CoffeeIcon className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Strictly OFF / Rest Day
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                  No active goals tracking required today. Recharge your mind & body.
                </p>
              </div>

              <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 pt-1">
                <span>View Sunday Zen View</span>
                <span>→</span>
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-amber-500/10 text-center">
            <span className="text-[10px] text-amber-400/70 italic">
              "Rest is not idleness, it is preparation for the next peak."
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
