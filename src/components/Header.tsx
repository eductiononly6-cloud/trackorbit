import React from 'react';
import { MonthModel } from '../types/tracker';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, HistoryIcon, SparklesIcon, WidgetIcon, EditIcon } from './Icons';
import { toDateString } from '../utils/calendarEngine';

interface HeaderProps {
  currentMonth: MonthModel;
  simulatedDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToday: () => void;
  onSimulateDateChange: (d: Date) => void;
  onOpenWidgetModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenGoalPlanner: () => void;
  totalMonthlyTarget: number;
  totalMonthlyCompleted: number;
  monthlyProgress: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonth,
  simulatedDate,
  onPrevMonth,
  onNextMonth,
  onResetToday,
  onSimulateDateChange,
  onOpenWidgetModal,
  onOpenHistoryModal,
  onOpenGoalPlanner,
  totalMonthlyTarget,
  totalMonthlyCompleted,
  monthlyProgress
}) => {
  const isSunday = simulatedDate.getDay() === 0;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[simulatedDate.getDay()];
  const formattedToday = simulatedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & Live Calendar Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                    TrackOrbit
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                  <span>{currentDayName}, {formattedToday}</span>
                  {isSunday && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-medium bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                      OFF DAY
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2 md:hidden">
              <button
                onClick={onOpenWidgetModal}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Widget Simulator"
              >
                <WidgetIcon className="w-4 h-4 text-indigo-400" />
              </button>
              <button
                onClick={onOpenGoalPlanner}
                className="p-2 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                title="Plan Goals"
              >
                <EditIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Navigation & Live Date Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Navigator */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
              <button
                onClick={onPrevMonth}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 flex items-center space-x-2">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-sm font-semibold text-white whitespace-nowrap">
                  {currentMonth.monthName} {currentMonth.year}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({currentMonth.weeksCount} wks)
                </span>
              </div>
              <button
                onClick={onNextMonth}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Next Month"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Date Simulator Dropdown / Today Reset */}
            <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
              <span className="text-slate-400 hidden sm:inline">Simulate Date:</span>
              <input
                type="date"
                value={toDateString(simulatedDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    onSimulateDateChange(new Date(y, m - 1, d));
                  }
                }}
                className="bg-slate-950 border border-slate-700/60 rounded px-1.5 py-0.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={onResetToday}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors text-[11px] font-medium"
              >
                Today
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-2.5">
              <button
                onClick={onOpenHistoryModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
              >
                <HistoryIcon className="w-3.5 h-3.5 text-violet-400" />
                <span>Month History</span>
              </button>

              <button
                onClick={onOpenWidgetModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/30 hover:border-indigo-500/60 text-xs font-medium text-indigo-300 hover:text-white transition-all shadow-sm"
              >
                <WidgetIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Widget Preview</span>
              </button>

              <button
                onClick={onOpenGoalPlanner}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
              >
                <EditIcon className="w-3.5 h-3.5" />
                <span>Configure Goals</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
