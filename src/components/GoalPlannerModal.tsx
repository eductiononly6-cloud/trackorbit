import React, { useState } from 'react';
import { GoalCategory, GoalItem, WeekModel } from '../types/tracker';
import { CloseIcon, PlusIcon, EditIcon, CheckIcon, SparklesIcon, CalendarIcon } from './Icons';

interface GoalPlannerModalProps {
  weeks: WeekModel[];
  weeklyGoalsMap: Record<string, GoalItem[]>;
  initialWeekId: string;
  onSaveWeekGoals: (weekId: string, goals: GoalItem[]) => void;
  onClose: () => void;
}

export const GoalPlannerModal: React.FC<GoalPlannerModalProps> = ({
  weeks,
  weeklyGoalsMap,
  initialWeekId,
  onSaveWeekGoals,
  onClose
}) => {
  const [selectedWeekId, setSelectedWeekId] = useState(initialWeekId);
  const currentWeek = weeks.find(w => w.id === selectedWeekId) || weeks[0];
  const currentGoals = weeklyGoalsMap[selectedWeekId] || [];

  // Local state for goals of selected week
  const [goals, setGoals] = useState<GoalItem[]>(currentGoals);

  // New Goal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<GoalCategory>('work');
  const [newUnit, setNewUnit] = useState('hrs');
  const [newWeeklyTarget, setNewWeeklyTarget] = useState(10);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Handle switching selected week inside modal
  const handleSelectWeek = (weekId: string) => {
    setSelectedWeekId(weekId);
    setGoals(weeklyGoalsMap[weekId] || []);
    setIsAddingNew(false);
  };

  // Add new custom goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const activeDays = currentWeek.activeDays;
    const dailyTargets: Record<string, number> = {};
    const completed: Record<string, number> = {};

    // Auto-distribute target evenly across active Mon-Sat days
    const dailyPortion = Math.max(1, Math.round(newWeeklyTarget / Math.max(1, activeDays.length)));
    activeDays.forEach(d => {
      dailyTargets[d.dateString] = dailyPortion;
      completed[d.dateString] = 0;
    });

    const newGoal: GoalItem = {
      id: `${selectedWeekId}-g-${Date.now()}`,
      weekId: selectedWeekId,
      title: newTitle.trim(),
      category: newCategory,
      unit: newUnit,
      weeklyTarget: Number(newWeeklyTarget),
      dailyTargets,
      completed,
      color: '#6366f1',
      icon: 'sparkles'
    };

    const updated = [...goals, newGoal];
    setGoals(updated);
    onSaveWeekGoals(selectedWeekId, updated);

    // Reset form
    setNewTitle('');
    setNewWeeklyTarget(10);
    setIsAddingNew(false);
  };

  // Delete goal
  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter(g => g.id !== goalId);
    setGoals(updated);
    onSaveWeekGoals(selectedWeekId, updated);
  };

  // Update target for existing goal
  const handleUpdateWeeklyTarget = (goalId: string, newTarget: number) => {
    const updated = goals.map(g => {
      if (g.id === goalId) {
        const activeDays = currentWeek.activeDays;
        const dailyPortion = Math.max(1, Math.round(newTarget / Math.max(1, activeDays.length)));
        const dailyTargets: Record<string, number> = {};
        activeDays.forEach(d => {
          dailyTargets[d.dateString] = dailyPortion;
        });

        return {
          ...g,
          weeklyTarget: newTarget,
          dailyTargets
        };
      }
      return g;
    });
    setGoals(updated);
    onSaveWeekGoals(selectedWeekId, updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <EditIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Goal Architecture & Weekly Planner
              </h3>
              <p className="text-xs text-slate-400">
                Configure unique goals for each week. Every week’s targets add up to your Monthly Goal.
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

        {/* Week Selector Bar */}
        <div className="p-4 bg-slate-950/30 border-b border-slate-800/80 flex space-x-2 overflow-x-auto scrollbar-none">
          {weeks.map(w => {
            const isSelected = w.id === selectedWeekId;
            return (
              <button
                key={w.id}
                onClick={() => handleSelectWeek(w.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {w.label} {w.isCurrentWeek && '• Current'}
              </button>
            );
          })}
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Week Info Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-xs">
            <div>
              <span className="font-bold text-white block">
                Editing Goals for {currentWeek.label}
              </span>
              <span className="text-slate-400">
                {currentWeek.totalActiveDays} Active Days (Mon–Sat) • Sunday is Rest Day
              </span>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-400 block text-[10px]">Weekly Target Sum:</span>
              <span className="text-base font-bold text-indigo-400">
                {goals.reduce((acc, g) => acc + g.weeklyTarget, 0)} units
              </span>
            </div>
          </div>

          {/* List of Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Configured Goals ({goals.length})
              </h4>
              {!isAddingNew && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center space-x-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Add Goal</span>
                </button>
              )}
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
                No unique goals set for this week yet. Click below to add one!
              </div>
            ) : (
              goals.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">
                        {g.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-indigo-300 uppercase">
                        {g.category}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Scheduled across active days (Mon-Sat). Unit: <span className="font-mono text-slate-300">{g.unit}</span>
                    </p>
                  </div>

                  {/* Target adjuster & delete */}
                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
                      <span className="text-slate-400">Target:</span>
                      <input
                        type="number"
                        min="1"
                        value={g.weeklyTarget}
                        onChange={(e) => handleUpdateWeeklyTarget(g.id, Math.max(1, Number(e.target.value)))}
                        className="w-14 bg-transparent text-white font-mono font-bold text-right focus:outline-none"
                      />
                      <span className="text-slate-400">{g.unit}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Remove Goal"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add New Goal Inline Form */}
          {isAddingNew && (
            <form onSubmit={handleAddGoal} className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-4">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Create Unique Goal for {currentWeek.label}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Goal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marathon Training, UI Design, Study"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as GoalCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="work">Work & Career</option>
                    <option value="fitness">Fitness & Health</option>
                    <option value="learning">Learning & Skills</option>
                    <option value="health">Hydration & Wellness</option>
                    <option value="mindset">Mindset & Habits</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="hrs, km, sessions, pages"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Weekly Target Goal</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newWeeklyTarget}
                    onChange={(e) => setNewWeeklyTarget(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
                >
                  Save Goal
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Changes automatically update monthly progress totals.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20"
          >
            Done Planning
          </button>
        </div>

      </div>
    </div>
  );
};
