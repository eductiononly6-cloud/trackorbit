import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { GoalItem, MonthModel } from './types/tracker';
import { getLiveMonthModel } from './utils/calendarEngine';
import {
  calculateMonthlyOverview,
  calculateWeeklySums,
  createDefaultGoalsForWeek,
  buildWidgetPayload
} from './utils/goalEngine';
import { LocalStorageDB } from './services/db';
import { WidgetSyncBridge } from './services/widgetBridge';

import { Header } from './components/Header';
import { MonthlyOverviewCard } from './components/MonthlyOverviewCard';
import { WeekTabs } from './components/WeekTabs';
import { CurrentWeekBanner } from './components/CurrentWeekBanner';
import { DailyTaskBoard } from './components/DailyTaskBoard';
import { SundayRestView } from './components/SundayRestView';
import { GoalPlannerModal } from './components/GoalPlannerModal';
import { PastWeeksHistoryModal } from './components/PastWeeksHistoryModal';
import { WidgetSimulatorModal } from './components/WidgetSimulatorModal';

export const App: React.FC = () => {
  // Live Date & Simulated Date State (Allows testing Sunday rest and rollover)
  const [simulatedDate, setSimulatedDate] = useState<Date>(new Date(2026, 9, 1)); // Default to Oct 1, 2026 or new Date()
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 9, 1));

  // Initialize or fetch current live calendar month model
  const monthModel: MonthModel = useMemo(() => {
    return getLiveMonthModel(currentMonthDate, simulatedDate);
  }, [currentMonthDate, simulatedDate]);

  // Track the selected week ID (defaults to current week)
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');

  // Weekly Goals Map: Record<weekId, GoalItem[]>
  const [weeklyGoalsMap, setWeeklyGoalsMap] = useState<Record<string, GoalItem[]>>({});

  // Modals state
  const [isGoalPlannerOpen, setIsGoalPlannerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [showSundayRestOverlay, setShowSundayRestOverlay] = useState(false);

  // Initialize selected week to the live current week whenever monthModel changes
  useEffect(() => {
    const liveCurrentWeek = monthModel.weeks.find(w => w.isCurrentWeek) || monthModel.weeks[0];
    if (liveCurrentWeek) {
      setSelectedWeekId(prev => {
        // If current selection is invalid for this month, reset to liveCurrentWeek.id
        const exists = monthModel.weeks.some(w => w.id === prev);
        return exists ? prev : liveCurrentWeek.id;
      });
    }
  }, [monthModel]);

  // Load goals from storage or initialize default goals for each week
  useEffect(() => {
    const newMap: Record<string, GoalItem[]> = {};

    monthModel.weeks.forEach(week => {
      const stored = LocalStorageDB.getWeeklyGoals(week.id);
      if (stored && stored.length > 0) {
        newMap[week.id] = stored;
      } else {
        // Create default goals for this week so user has rich initial goals
        const defaults = createDefaultGoalsForWeek(week);
        LocalStorageDB.saveWeeklyGoals(week.id, defaults);
        newMap[week.id] = defaults;
      }
    });

    setWeeklyGoalsMap(newMap);
  }, [monthModel]);

  // Calculate Monthly Overview (Monthly Goal = Sum of all Weekly Goals)
  const monthlyOverview = useMemo(() => {
    return calculateMonthlyOverview(monthModel, weeklyGoalsMap);
  }, [monthModel, weeklyGoalsMap]);

  // Selected week object
  const selectedWeek = useMemo(() => {
    return monthModel.weeks.find(w => w.id === selectedWeekId) || monthModel.weeks[0];
  }, [monthModel, selectedWeekId]);

  // Goals for the selected week
  const selectedWeekGoals = useMemo(() => {
    if (!selectedWeek) return [];
    return weeklyGoalsMap[selectedWeek.id] || [];
  }, [weeklyGoalsMap, selectedWeek]);

  // Selected week progress
  const selectedWeekSums = useMemo(() => {
    return calculateWeeklySums(selectedWeekGoals);
  }, [selectedWeekGoals]);

  // Map of weekly progress percentages for all weeks
  const weeklyProgressMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthModel.weeks.forEach(w => {
      const goals = weeklyGoalsMap[w.id] || [];
      map[w.id] = calculateWeeklySums(goals).percentage;
    });
    return map;
  }, [monthModel, weeklyGoalsMap]);

  // Sync with Native Widget Bridge whenever goals or date changes
  const widgetPayload = useMemo(() => {
    return buildWidgetPayload(monthModel, weeklyGoalsMap, simulatedDate);
  }, [monthModel, weeklyGoalsMap, simulatedDate]);

  useEffect(() => {
    WidgetSyncBridge.syncWidgetData(widgetPayload);
  }, [widgetPayload]);

  // Handlers for month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleResetToday = () => {
    const now = new Date(2026, 9, 1); // Current anchor or new Date()
    setSimulatedDate(now);
    setCurrentMonthDate(now);
  };

  const handleSimulateDateChange = (d: Date) => {
    setSimulatedDate(d);
    // Also keep month in sync if year/month changed
    if (d.getMonth() !== currentMonthDate.getMonth() || d.getFullYear() !== currentMonthDate.getFullYear()) {
      setCurrentMonthDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  // Handler to update daily progress for a goal
  const handleUpdateProgress = (goalId: string, dateString: string, newCompletedValue: number) => {
    if (!selectedWeek) return;

    const updated = LocalStorageDB.updateDailyProgress(selectedWeek.id, goalId, dateString, newCompletedValue);
    if (updated) {
      setWeeklyGoalsMap(prev => ({
        ...prev,
        [selectedWeek.id]: updated
      }));

      // Trigger celebratory confetti if weekly goal reaches 100%
      const { percentage } = calculateWeeklySums(updated);
      if (percentage >= 100 && selectedWeekSums.percentage < 100) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Handler to save updated weekly goals from planner
  const handleSaveWeekGoals = (weekId: string, goals: GoalItem[]) => {
    LocalStorageDB.saveWeeklyGoals(weekId, goals);
    setWeeklyGoalsMap(prev => ({
      ...prev,
      [weekId]: goals
    }));
  };

  // Determine if today is Sunday
  const isTodaySunday = simulatedDate.getDay() === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar Header */}
      <Header
        currentMonth={monthModel}
        simulatedDate={simulatedDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onResetToday={handleResetToday}
        onSimulateDateChange={handleSimulateDateChange}
        onOpenWidgetModal={() => setIsWidgetModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onOpenGoalPlanner={() => setIsGoalPlannerOpen(true)}
        totalMonthlyTarget={monthlyOverview.totalMonthlyTarget}
        totalMonthlyCompleted={monthlyOverview.totalMonthlyCompleted}
        monthlyProgress={monthlyOverview.progressPercentage}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Cumulative Monthly Overview Card (Add-on System) */}
        <MonthlyOverviewCard
          overview={monthlyOverview}
          activeWeekNumber={selectedWeek ? selectedWeek.weekNumber : 1}
        />

        {/* Calendar Week Splitter Tabs (Live Month Based) */}
        <WeekTabs
          weeks={monthModel.weeks}
          selectedWeekId={selectedWeekId}
          onSelectWeek={(wId) => {
            setSelectedWeekId(wId);
            setShowSundayRestOverlay(false);
          }}
          weeklyProgressMap={weeklyProgressMap}
        />

        {/* Current Week Banner (Rollover & Active Week Indicator) */}
        {selectedWeek && (
          <CurrentWeekBanner
            week={selectedWeek}
            targetSum={selectedWeekSums.targetSum}
            completedSum={selectedWeekSums.completedSum}
            progressPercentage={selectedWeekSums.percentage}
            onEditGoals={() => setIsGoalPlannerOpen(true)}
            isViewingLiveCurrentWeek={selectedWeek.isCurrentWeek}
          />
        )}

        {/* Dynamic UI: Sunday Rest Mode vs Daily Task Board */}
        {isTodaySunday && selectedWeek?.isCurrentWeek ? (
          /* When today is live Sunday, show dedicated Sunday Rest Sanctuary */
          <div className="space-y-4">
            <SundayRestView
              week={selectedWeek}
              weeklyTarget={selectedWeekSums.targetSum}
              weeklyCompleted={selectedWeekSums.completedSum}
              weeklyProgress={selectedWeekSums.percentage}
              isTodaySunday={true}
            />
            {/* Still allow user to toggle below to see past days if needed */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Completed Days in this Sprint (Mon - Sat)
              </h4>
              <DailyTaskBoard
                week={selectedWeek}
                goals={selectedWeekGoals}
                simulatedDate={simulatedDate}
                onUpdateProgress={handleUpdateProgress}
                onSelectSundayRest={() => {}}
              />
            </div>
          </div>
        ) : showSundayRestOverlay && selectedWeek ? (
          /* When user explicitly tapped Sunday Rest Day card */
          <SundayRestView
            week={selectedWeek}
            weeklyTarget={selectedWeekSums.targetSum}
            weeklyCompleted={selectedWeekSums.completedSum}
            weeklyProgress={selectedWeekSums.percentage}
            onClose={() => setShowSundayRestOverlay(false)}
            isTodaySunday={false}
          />
        ) : (
          /* Normal Monday to Saturday Daily Actionable Targets Board */
          selectedWeek && (
            <DailyTaskBoard
              week={selectedWeek}
              goals={selectedWeekGoals}
              simulatedDate={simulatedDate}
              onUpdateProgress={handleUpdateProgress}
              onSelectSundayRest={() => setShowSundayRestOverlay(true)}
            />
          )
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <p>
          TrackOrbit • Cross-Platform Goal Tracking Architecture (Live Month • Mon–Sat Sprint • Sunday Rest Day)
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Syncs with native Apple iOS (SwiftUI WidgetKit) & Android (Material You AppWidget)
        </p>
      </footer>

      {/* Goal Planner Modal */}
      {isGoalPlannerOpen && selectedWeek && (
        <GoalPlannerModal
          weeks={monthModel.weeks}
          weeklyGoalsMap={weeklyGoalsMap}
          initialWeekId={selectedWeekId}
          onSaveWeekGoals={handleSaveWeekGoals}
          onClose={() => setIsGoalPlannerOpen(false)}
        />
      )}

      {/* History & Past Weeks Modal */}
      {isHistoryModalOpen && (
        <PastWeeksHistoryModal
          month={monthModel}
          overview={monthlyOverview}
          weeklyGoalsMap={weeklyGoalsMap}
          onClose={() => setIsHistoryModalOpen(false)}
          onSelectWeekToView={(wId) => setSelectedWeekId(wId)}
        />
      )}

      {/* Home Screen Widget Simulator Modal */}
      {isWidgetModalOpen && (
        <WidgetSimulatorModal
          payload={widgetPayload}
          onClose={() => setIsWidgetModalOpen(false)}
        />
      )}

    </div>
  );
};
