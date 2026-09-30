import React, { useState } from 'react';
import { WidgetPayload } from '../types/tracker';
import { CloseIcon, WidgetIcon, CheckIcon, TrophyIcon, SparklesIcon, FlameIcon, CoffeeIcon } from './Icons';

interface WidgetSimulatorModalProps {
  payload: WidgetPayload;
  onClose: () => void;
}

export const WidgetSimulatorModal: React.FC<WidgetSimulatorModalProps> = ({
  payload,
  onClose
}) => {
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android'>('ios');
  const [activeSize, setActiveSize] = useState<'medium' | 'small'>('medium');
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <WidgetIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Live Home Screen Widget Simulator
              </h3>
              <p className="text-xs text-slate-400">
                Preview real-time native iOS (WidgetKit/SwiftUI) and Android (AppWidget/Glance) components.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyJson}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white"
            >
              {copied ? 'Copied JSON!' : 'Copy Widget Payload'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Platform & Size Tabs */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Device Platform:</span>
            <button
              onClick={() => setActivePlatform('ios')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activePlatform === 'ios'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Apple iOS (WidgetKit)
            </button>
            <button
              onClick={() => setActivePlatform('android')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activePlatform === 'android'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Android (Material You)
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Widget Size:</span>
            <button
              onClick={() => setActiveSize('medium')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeSize === 'medium'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Medium (2x4 / Wide)
            </button>
            <button
              onClick={() => setActiveSize('small')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                activeSize === 'small'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              Small (2x2 / Square)
            </button>
          </div>
        </div>

        {/* Sandbox Canvas */}
        <div className="p-8 bg-slate-950 flex flex-col items-center justify-center min-h-[380px] relative">
          
          {/* Subtle phone wallpaper background mockup */}
          <div className="absolute inset-0 bg-radial from-slate-900 to-slate-950 opacity-50 pointer-events-none" />

          {/* 1. iOS MEDIUM WIDGET */}
          {activePlatform === 'ios' && activeSize === 'medium' && (
            <div className="w-full max-w-[480px] h-[210px] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-[28px] p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between text-white font-sans">
              {/* Background gradient effect */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Top Row: Week header & Monthly Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-200 tracking-tight">
                    {payload.currentWeekLabel} Focus
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {payload.todayDayName}
                  </span>
                </div>

                {/* Small indicator showing overall cumulative Monthly Goal progress */}
                <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-semibold text-indigo-300">
                  <TrophyIcon className="w-3 h-3 text-indigo-400" />
                  <span>Month: {payload.monthlyProgress}%</span>
                </div>
              </div>

              {/* Middle Section: Active Goals & Today's Target */}
              {payload.isSunday ? (
                <div className="py-2 flex items-center space-x-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 text-amber-200">
                  <CoffeeIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Sunday Off / Rest Day</p>
                    <p className="text-[11px] text-amber-300/80">No active goals. Recharge for next week.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 my-1">
                  {payload.activeTodayGoals.slice(0, 4).map((g) => (
                    <div
                      key={g.id}
                      className="p-1.5 px-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-1">
                        <span className="font-semibold text-slate-200 truncate block text-[11px]">
                          {g.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {g.completed}/{g.target} {g.unit}
                        </span>
                      </div>
                      {g.isDone ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom: Current Week Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400 font-medium">Current Week Progress</span>
                  <span className="font-mono font-bold text-white">{payload.currentWeekProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, payload.currentWeekProgress)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. iOS SMALL WIDGET */}
          {activePlatform === 'ios' && activeSize === 'small' && (
            <div className="w-[180px] h-[180px] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-[28px] p-4 shadow-2xl relative overflow-hidden flex flex-col justify-between text-white font-sans">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200">
                  {payload.currentWeekLabel}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  {payload.monthlyProgress}% M
                </span>
              </div>

              {/* Center Target Metric or Rest */}
              <div className="text-center py-1">
                {payload.isSunday ? (
                  <div>
                    <CoffeeIcon className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                    <span className="text-[11px] font-bold text-amber-300 block">REST DAY</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-2xl font-extrabold text-white font-mono block">
                      {payload.todayCompletedCount}/{payload.todayTotalCount}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Today's Targets Done</span>
                  </div>
                )}
              </div>

              {/* Bottom Week Progress */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>Week</span>
                  <span>{payload.currentWeekProgress}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${Math.min(100, payload.currentWeekProgress)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. ANDROID MATERIAL YOU WIDGET (Medium) */}
          {activePlatform === 'android' && activeSize === 'medium' && (
            <div className="w-full max-w-[480px] h-[210px] bg-[#1a1c1e] border border-slate-800 rounded-[32px] p-5 shadow-2xl relative flex flex-col justify-between text-slate-100 font-sans">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold tracking-tight text-white">
                    {payload.currentWeekLabel} • {payload.todayDayName}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {payload.todayTargetSummary}
                  </p>
                </div>
                {/* Material Pill for Monthly Goal Progress */}
                <div className="px-3 py-1 rounded-full bg-[#3b4856] text-[11px] font-medium text-emerald-300 flex items-center space-x-1">
                  <TrophyIcon className="w-3 h-3 text-emerald-400" />
                  <span>Month {payload.monthlyProgress}%</span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-1.5 my-1">
                {payload.activeTodayGoals.slice(0, 3).map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-[#282a2d] text-xs"
                  >
                    <span className="text-slate-200 truncate">{g.title}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {g.completed} / {g.target} {g.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Week Progress</span>
                  <span className="font-mono font-bold text-emerald-400">{payload.currentWeekProgress}%</span>
                </div>
                <div className="w-full bg-[#282a2d] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, payload.currentWeekProgress)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. ANDROID MATERIAL YOU WIDGET (Small) */}
          {activePlatform === 'android' && activeSize === 'small' && (
            <div className="w-[180px] h-[180px] bg-[#1a1c1e] border border-slate-800 rounded-[32px] p-4 shadow-2xl relative flex flex-col justify-between text-slate-100 font-sans">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  {payload.currentWeekLabel}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3b4856] text-emerald-300 font-mono">
                  {payload.monthlyProgress}%
                </span>
              </div>

              <div className="text-center">
                <span className="text-2xl font-bold font-mono text-emerald-400 block">
                  {payload.todayCompletedCount}/{payload.todayTotalCount}
                </span>
                <span className="text-[10px] text-slate-400 block">Targets Met</span>
              </div>

              <div>
                <div className="w-full bg-[#282a2d] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${Math.min(100, payload.currentWeekProgress)}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 block text-right mt-1 font-mono">
                  {payload.currentWeekProgress}% Week
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Native Implementation Instructions Callout */}
        <div className="p-5 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white">
            📲 Native Integration Architecture:
          </p>
          <p className="text-slate-400 leading-relaxed">
            The data shown above is serialized through <code className="text-indigo-400 font-mono">WidgetSyncBridge</code> into shared device storage (<code className="text-slate-300 font-mono">UserDefaults(suiteName: "group.com.tracker.goals")</code> on iOS and <code className="text-slate-300 font-mono">SharedPreferences</code> on Android). The native Swift and Kotlin widget source code files are included in the repository under <code className="text-emerald-400 font-mono">ios/GoalsWidget/</code> and <code className="text-emerald-400 font-mono">android/app/src/main/</code>.
          </p>
        </div>

      </div>
    </div>
  );
};
