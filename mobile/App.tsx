import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { GoalItem, MonthModel, WeekModel } from './src/types/tracker';
import { getLiveMonthModel, toDateString, formatWeekRange } from './src/utils/calendarEngine';
import {
  calculateMonthlyOverview,
  calculateWeeklySums,
  createDefaultGoalsForWeek,
  buildWidgetPayload
} from './src/utils/goalEngine';
import { MobileDatabaseService } from './src/services/sqliteService';

export default function App() {
  const [simulatedDate, setSimulatedDate] = useState<Date>(new Date(2026, 9, 1)); // Oct 1, 2026 or new Date()
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 9, 1));

  // Initialize live month model
  const monthModel: MonthModel = useMemo(() => {
    return getLiveMonthModel(currentMonthDate, simulatedDate);
  }, [currentMonthDate, simulatedDate]);

  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [weeklyGoalsMap, setWeeklyGoalsMap] = useState<Record<string, GoalItem[]>>({});

  // Modals
  const [isGoalPlannerOpen, setIsGoalPlannerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [showSundayRestOverlay, setShowSundayRestOverlay] = useState(false);

  // Interactive Planner State
  const [plannerWeekId, setPlannerWeekId] = useState<string>('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalUnit, setNewGoalUnit] = useState('hrs');
  const [newGoalTarget, setNewGoalTarget] = useState('10');
  const [isAddingNewGoal, setIsAddingNewGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUnit, setEditUnit] = useState('hrs');
  const [editTarget, setEditTarget] = useState('10');

  // Initialize selected week to current week
  useEffect(() => {
    const liveCurrentWeek = monthModel.weeks.find(w => w.isCurrentWeek) || monthModel.weeks[0];
    if (liveCurrentWeek) {
      setSelectedWeekId(prev => {
        const exists = monthModel.weeks.some(w => w.id === prev);
        return exists ? prev : liveCurrentWeek.id;
      });
    }
  }, [monthModel]);

  // Load goals from SQLite / AsyncStorage or initialize defaults
  useEffect(() => {
    async function loadData() {
      await MobileDatabaseService.initDB();
      const newMap: Record<string, GoalItem[]> = {};

      for (const week of monthModel.weeks) {
        const stored = await MobileDatabaseService.getWeeklyGoals(week.id);
        if (stored && stored.length > 0) {
          newMap[week.id] = stored;
        } else {
          const defaults = createDefaultGoalsForWeek(week);
          await MobileDatabaseService.saveWeeklyGoals(week.id, defaults);
          newMap[week.id] = defaults;
        }
      }
      setWeeklyGoalsMap(newMap);
    }
    loadData();
  }, [monthModel]);

  // Calculate Monthly Overview (Monthly Goal = Sum of all Weekly Goals)
  const monthlyOverview = useMemo(() => {
    return calculateMonthlyOverview(monthModel, weeklyGoalsMap);
  }, [monthModel, weeklyGoalsMap]);

  const selectedWeek = useMemo(() => {
    return monthModel.weeks.find(w => w.id === selectedWeekId) || monthModel.weeks[0];
  }, [monthModel, selectedWeekId]);

  const selectedWeekGoals = useMemo(() => {
    if (!selectedWeek) return [];
    return weeklyGoalsMap[selectedWeek.id] || [];
  }, [weeklyGoalsMap, selectedWeek]);

  const selectedWeekSums = useMemo(() => {
    return calculateWeeklySums(selectedWeekGoals);
  }, [selectedWeekGoals]);

  const widgetPayload = useMemo(() => {
    return buildWidgetPayload(monthModel, weeklyGoalsMap, simulatedDate);
  }, [monthModel, weeklyGoalsMap, simulatedDate]);

  // Progress update handler
  const handleUpdateProgress = async (goalId: string, dateString: string, newCompletedValue: number) => {
    if (!selectedWeek) return;
    const updated = await MobileDatabaseService.updateDailyProgress(
      selectedWeek.id,
      goalId,
      dateString,
      newCompletedValue
    );
    if (updated) {
      setWeeklyGoalsMap(prev => ({ ...prev, [selectedWeek.id]: updated }));
    }
  };

  const activePlannerWeek = useMemo(() => {
    return monthModel.weeks.find(w => w.id === plannerWeekId) || selectedWeek;
  }, [monthModel, plannerWeekId, selectedWeek]);

  const activePlannerGoals = useMemo(() => {
    if (!activePlannerWeek) return [];
    return weeklyGoalsMap[activePlannerWeek.id] || [];
  }, [weeklyGoalsMap, activePlannerWeek]);

  const handleUpdateGoalTarget = async (goalId: string, newTarget: number) => {
    if (!activePlannerWeek) return;
    const clampedTarget = Math.max(1, newTarget);
    const activeDays = activePlannerWeek.activeDays;
    const dailyPortion = Math.max(1, Math.round(clampedTarget / Math.max(1, activeDays.length)));

    const updated = activePlannerGoals.map(g => {
      if (g.id === goalId) {
        const dailyTargets: Record<string, number> = {};
        activeDays.forEach(d => {
          dailyTargets[d.dateString] = dailyPortion;
        });
        return {
          ...g,
          weeklyTarget: clampedTarget,
          dailyTargets
        };
      }
      return g;
    });

    await MobileDatabaseService.saveWeeklyGoals(activePlannerWeek.id, updated);
    setWeeklyGoalsMap(prev => ({ ...prev, [activePlannerWeek.id]: updated }));
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!activePlannerWeek) return;
    const updated = activePlannerGoals.filter(g => g.id !== goalId);
    await MobileDatabaseService.saveWeeklyGoals(activePlannerWeek.id, updated);
    setWeeklyGoalsMap(prev => ({ ...prev, [activePlannerWeek.id]: updated }));
    if (editingGoalId === goalId) {
      setEditingGoalId(null);
    }
  };

  const startEditingGoal = (g: GoalItem) => {
    setEditingGoalId(g.id);
    setEditTitle(g.title);
    setEditUnit(g.unit);
    setEditTarget(g.weeklyTarget.toString());
  };

  const handleSaveEditedGoal = async () => {
    if (!editingGoalId || !activePlannerWeek || !editTitle.trim()) return;
    const targetVal = Math.max(1, parseInt(editTarget) || 1);
    const activeDays = activePlannerWeek.activeDays;
    const dailyPortion = Math.max(1, Math.round(targetVal / Math.max(1, activeDays.length)));

    const updated = activePlannerGoals.map(g => {
      if (g.id === editingGoalId) {
        const dailyTargets: Record<string, number> = {};
        activeDays.forEach(d => {
          dailyTargets[d.dateString] = dailyPortion;
        });
        return {
          ...g,
          title: editTitle.trim(),
          unit: editUnit.trim() || 'units',
          weeklyTarget: targetVal,
          dailyTargets
        };
      }
      return g;
    });

    await MobileDatabaseService.saveWeeklyGoals(activePlannerWeek.id, updated);
    setWeeklyGoalsMap(prev => ({ ...prev, [activePlannerWeek.id]: updated }));
    setEditingGoalId(null);
  };

  const handleAddNewGoal = async () => {
    if (!newGoalTitle.trim() || !activePlannerWeek) return;
    const targetVal = Math.max(1, parseInt(newGoalTarget) || 10);
    const activeDays = activePlannerWeek.activeDays;
    const dailyPortion = Math.max(1, Math.round(targetVal / Math.max(1, activeDays.length)));

    const dailyTargets: Record<string, number> = {};
    const completed: Record<string, number> = {};
    activeDays.forEach(d => {
      dailyTargets[d.dateString] = dailyPortion;
      completed[d.dateString] = 0;
    });

    const newGoal: GoalItem = {
      id: `${activePlannerWeek.id}-g-${Date.now()}`,
      weekId: activePlannerWeek.id,
      title: newGoalTitle.trim(),
      category: 'work',
      unit: newGoalUnit.trim() || 'units',
      weeklyTarget: targetVal,
      dailyTargets,
      completed,
      color: '#6366f1',
      icon: 'target'
    };

    const updated = [...activePlannerGoals, newGoal];
    await MobileDatabaseService.saveWeeklyGoals(activePlannerWeek.id, updated);
    setWeeklyGoalsMap(prev => ({ ...prev, [activePlannerWeek.id]: updated }));

    setNewGoalTitle('');
    setNewGoalTarget('10');
    setIsAddingNewGoal(false);
  };

  const isTodaySunday = simulatedDate.getDay() === 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" translucent={true} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitle}>TrackOrbit</Text>
            <View style={styles.badgeLive}>
              <Text style={styles.badgeLiveText}>LIVE MONTH</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            {simulatedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {isTodaySunday ? ' • REST DAY' : ' • ACTIVE SPRINT'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsWidgetModalOpen(true)}
          >
            <Text style={styles.iconButtonText}>📲 Widget</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setPlannerWeekId(selectedWeekId);
              setIsAddingNewGoal(false);
              setIsGoalPlannerOpen(true);
            }}
          >
            <Text style={styles.primaryButtonText}>+ Plan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        
        {/* Cumulative Monthly Overview Card (Add-on System) */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.cardTag}>CUMULATIVE ADD-ON GOAL</Text>
              <Text style={styles.cardTitle}>
                {monthModel.monthName} {monthModel.year}
              </Text>
            </View>
            <View style={styles.percentagePill}>
              <Text style={styles.percentageText}>{monthlyOverview.progressPercentage}%</Text>
            </View>
          </View>

          <Text style={styles.cardDescription}>
            Monthly Target = Sum of all {monthModel.weeksCount} Weekly Goals. Weekly progress accumulates continuously.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Monthly Goal Sum</Text>
              <Text style={styles.statValue}>{monthlyOverview.totalMonthlyTarget} <Text style={styles.statUnit}>units</Text></Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Logged Add-on</Text>
              <Text style={[styles.statValue, { color: '#34d399' }]}>
                {monthlyOverview.totalMonthlyCompleted} <Text style={styles.statUnit}>units</Text>
              </Text>
            </View>
          </View>

          {/* Multi-week breakdown progress bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, monthlyOverview.progressPercentage)}%` }
              ]}
            />
          </View>
          <View style={styles.weekPillsRow}>
            {monthlyOverview.weeklyBreakdown.map((w) => (
              <Text key={w.weekNumber} style={styles.weekBreakdownText}>
                W{w.weekNumber}: {w.percentage}%
              </Text>
            ))}
          </View>
        </View>

        {/* Week Splitter Tabs (Live Month Based) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            CALENDAR WEEKS ({monthModel.weeksCount} WEEKS)
          </Text>
          <TouchableOpacity onPress={() => setIsHistoryModalOpen(true)}>
            <Text style={styles.historyLink}>History & Recap →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weeksScroll}>
          {monthModel.weeks.map((w) => {
            const isSelected = w.id === selectedWeekId;
            const progress = calculateWeeklySums(weeklyGoalsMap[w.id] || []).percentage;

            return (
              <TouchableOpacity
                key={w.id}
                onPress={() => setSelectedWeekId(w.id)}
                style={[styles.weekTab, isSelected && styles.weekTabActive]}
              >
                <View style={styles.weekTabHeader}>
                  <Text style={[styles.weekTabTitle, isSelected && { color: '#fff' }]}>
                    {w.label}
                  </Text>
                  {w.isCurrentWeek && (
                    <View style={styles.currentDot} />
                  )}
                </View>
                <Text style={styles.weekTabDates}>{formatWeekRange(w)}</Text>
                <Text style={styles.weekTabProgress}>{progress}% completed</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Current Week Banner */}
        {selectedWeek && (
          <View style={styles.currentWeekBanner}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.bannerWeekTitle}>{selectedWeek.label} Active Targets</Text>
              <Text style={styles.bannerSubtitle}>
                {selectedWeek.totalActiveDays} Days (Mon-Sat) • Sunday Rest
              </Text>
              <TouchableOpacity
                style={styles.bannerEditBtn}
                onPress={() => {
                  setPlannerWeekId(selectedWeek.id);
                  setIsAddingNewGoal(false);
                  setEditingGoalId(null);
                  setIsGoalPlannerOpen(true);
                }}
              >
                <Text style={styles.bannerEditBtnText}>✎ Edit This Week's Plan</Text>
              </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={styles.bannerProgressText}>{selectedWeekSums.percentage}%</Text>
              <Text style={styles.bannerProgressSub}>
                {selectedWeekSums.completedSum}/{selectedWeekSums.targetSum} done
              </Text>
            </View>
          </View>
        )}

        {/* Sunday Sanctuary / Rest View OR Monday - Saturday Daily Tasks */}
        {isTodaySunday && selectedWeek?.isCurrentWeek ? (
          <View style={styles.sundayZenCard}>
            <Text style={styles.sundayBadge}>☕ SUNDAY REST PROTOCOL</Text>
            <Text style={styles.sundayZenTitle}>Strictly OFF / Rest Day</Text>
            <Text style={styles.sundayZenDesc}>
              No active goals tracking required today. By design, our 6-day sprint is complete. Sundays are strictly reserved for recovery and reflection.
            </Text>
            <View style={styles.sundayRecapBox}>
              <Text style={styles.recapLabel}>Week Performance Recap</Text>
              <Text style={styles.recapStat}>
                {selectedWeekSums.completedSum} of {selectedWeekSums.targetSum} Units Achieved ({selectedWeekSums.percentage}%)
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.dailyBoard}>
            {selectedWeek?.activeDays.map((day) => {
              const isToday = day.isToday;
              const dayGoals = selectedWeekGoals.filter(
                g => (g.dailyTargets[day.dateString] ?? 0) > 0
              );

              return (
                <View
                  key={day.dateString}
                  style={[styles.dayCard, isToday && styles.dayCardToday]}
                >
                  <View style={styles.dayCardHeader}>
                    <Text style={styles.dayCardName}>{day.dayName}, {day.dayOfMonth}</Text>
                    {isToday && (
                      <View style={styles.todayPill}>
                        <Text style={styles.todayPillText}>TODAY</Text>
                      </View>
                    )}
                  </View>

                  {dayGoals.map((goal) => {
                    const target = goal.dailyTargets[day.dateString] ?? 0;
                    const completed = goal.completed[day.dateString] ?? 0;
                    const isDone = target > 0 ? completed >= target : false;

                    return (
                      <View key={goal.id} style={styles.goalRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.goalTitle}>{goal.title}</Text>
                          <Text style={styles.goalQuota}>
                            Target: {target} {goal.unit} • Done: {completed}
                          </Text>
                        </View>

                        <View style={styles.stepperRow}>
                          <TouchableOpacity
                            onPress={() => handleUpdateProgress(goal.id, day.dateString, Math.max(0, completed - 1))}
                            style={styles.stepBtn}
                          >
                            <Text style={styles.stepBtnText}>−</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleUpdateProgress(goal.id, day.dateString, isDone ? 0 : target)}
                            style={[styles.checkBtn, isDone && styles.checkBtnDone]}
                          >
                            <Text style={[styles.checkBtnText, isDone && { color: '#000' }]}>
                              {isDone ? '✓' : '○'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleUpdateProgress(goal.id, day.dateString, completed + 1)}
                            style={styles.stepBtn}
                          >
                            <Text style={styles.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })}

            {/* Sunday Rest Card */}
            <View style={styles.sundayCard}>
              <Text style={styles.sundayCardTag}>SUNDAY • REST / OFF DAY</Text>
              <Text style={styles.sundayCardTitle}>Recovery & Recharge</Text>
              <Text style={styles.sundayCardDesc}>
                Active tracking paused until Monday 00:00 rollover.
              </Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Goal Planner Modal */}
      <Modal visible={isGoalPlannerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Weekly Goal Planner</Text>
                <Text style={styles.modalSub}>
                  Decide specific goals for each individual week
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsGoalPlannerOpen(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Week Switcher Inside Modal */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalWeekTabs}>
              {monthModel.weeks.map(w => {
                const isSelected = w.id === activePlannerWeek?.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => {
                      setPlannerWeekId(w.id);
                      setIsAddingNewGoal(false);
                    }}
                    style={[styles.modalWeekPill, isSelected && styles.modalWeekPillActive]}
                  >
                    <Text style={[styles.modalWeekPillText, isSelected && { color: '#ffffff', fontWeight: '800' }]}>
                      {w.label} {w.isCurrentWeek ? '• Current' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Target Sum Banner */}
            <View style={styles.modalWeekBanner}>
              <Text style={styles.modalBannerText}>
                Editing {activePlannerWeek?.label} ({activePlannerWeek?.totalActiveDays} Mon–Sat Days)
              </Text>
              <Text style={styles.modalBannerSum}>
                Sum: {activePlannerGoals.reduce((a, b) => a + b.weeklyTarget, 0)} units
              </Text>
            </View>

            {/* Goals List with Edit Target Steppers, Edit Form & Delete */}
            <ScrollView style={{ maxHeight: 240, marginVertical: 6 }}>
              {activePlannerGoals.length === 0 ? (
                <Text style={styles.noGoalsText}>No goals yet for {activePlannerWeek?.label}. Add one below!</Text>
              ) : (
                activePlannerGoals.map((g) => {
                  const isEditingThis = editingGoalId === g.id;

                  if (isEditingThis) {
                    return (
                      <View key={g.id} style={styles.editGoalCard}>
                        <Text style={styles.editGoalHeader}>Edit Goal</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Goal Title"
                          placeholderTextColor="#64748b"
                          value={editTitle}
                          onChangeText={setEditTitle}
                        />
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Unit"
                            placeholderTextColor="#64748b"
                            value={editUnit}
                            onChangeText={setEditUnit}
                          />
                          <TextInput
                            style={[styles.input, { width: 90 }]}
                            placeholder="Target"
                            placeholderTextColor="#64748b"
                            keyboardType="numeric"
                            value={editTarget}
                            onChangeText={setEditTarget}
                          />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                          <TouchableOpacity
                            onPress={() => setEditingGoalId(null)}
                            style={styles.cancelBtn}
                          >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleSaveEditedGoal}
                            style={styles.saveGoalBtn}
                          >
                            <Text style={styles.saveGoalBtnText}>Update</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={g.id} style={styles.modalGoalRow}>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text style={styles.modalGoalTitle}>{g.title}</Text>
                        <Text style={styles.modalGoalUnit}>
                          Weekly Target: {g.weeklyTarget} {g.unit}
                        </Text>
                      </View>

                      {/* Quick Stepper to change target */}
                      <View style={styles.modalStepperRow}>
                        <TouchableOpacity
                          onPress={() => handleUpdateGoalTarget(g.id, g.weeklyTarget - 1)}
                          style={styles.modalStepBtn}
                        >
                          <Text style={styles.modalStepBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTargetVal}>{g.weeklyTarget}</Text>
                        <TouchableOpacity
                          onPress={() => handleUpdateGoalTarget(g.id, g.weeklyTarget + 1)}
                          style={styles.modalStepBtn}
                        >
                          <Text style={styles.modalStepBtnText}>+</Text>
                        </TouchableOpacity>

                        {/* Edit button */}
                        <TouchableOpacity
                          onPress={() => startEditingGoal(g)}
                          style={styles.modalEditBtn}
                        >
                          <Text style={styles.modalEditBtnText}>✎</Text>
                        </TouchableOpacity>

                        {/* Delete button */}
                        <TouchableOpacity
                          onPress={() => handleDeleteGoal(g.id)}
                          style={styles.modalDeleteBtn}
                        >
                          <Text style={styles.modalDeleteBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Add New Goal Form / Toggle */}
            {isAddingNewGoal ? (
              <View style={styles.newGoalForm}>
                <Text style={styles.newGoalHeader}>Add Goal to {activePlannerWeek?.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Goal Title (e.g. Marathon, Deep Work, Reading)"
                  placeholderTextColor="#64748b"
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Unit (hrs, km, pages)"
                    placeholderTextColor="#64748b"
                    value={newGoalUnit}
                    onChangeText={setNewGoalUnit}
                  />
                  <TextInput
                    style={[styles.input, { width: 90 }]}
                    placeholder="Target"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={newGoalTarget}
                    onChangeText={setNewGoalTarget}
                  />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => setIsAddingNewGoal(false)}
                    style={styles.cancelBtn}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddNewGoal}
                    style={styles.saveGoalBtn}
                  >
                    <Text style={styles.saveGoalBtnText}>Save Goal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsAddingNewGoal(true)}
                style={styles.addGoalTriggerBtn}
              >
                <Text style={styles.addGoalTriggerText}>+ Add New Goal to this Week</Text>
              </TouchableOpacity>
            )}

            {/* Done Button */}
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setIsGoalPlannerOpen(false)}
            >
              <Text style={styles.modalDoneText}>Done Planning</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Widget Simulator Modal */}
      <Modal visible={isWidgetModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Home Screen Widget</Text>
              <TouchableOpacity onPress={() => setIsWidgetModalOpen(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Widget Simulation Mockup */}
            <View style={styles.widgetMockup}>
              <View style={styles.widgetMockupHeader}>
                <Text style={styles.widgetWeekText}>{widgetPayload.currentWeekLabel}</Text>
                <View style={styles.widgetMonthBadge}>
                  <Text style={styles.widgetMonthBadgeText}>Month: {widgetPayload.monthlyProgress}%</Text>
                </View>
              </View>

              <Text style={styles.widgetTodayText}>
                {widgetPayload.isSunday ? '☕ Sunday Rest Day' : `${widgetPayload.todayCompletedCount} of ${widgetPayload.todayTotalCount} Targets Met`}
              </Text>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.widgetProgressLabel}>Week Progress: {widgetPayload.currentWeekProgress}%</Text>
                <View style={styles.widgetProgressBarBg}>
                  <View style={[styles.widgetProgressBarFill, { width: `${widgetPayload.currentWeekProgress}%` }]} />
                </View>
              </View>
            </View>

            <Text style={styles.widgetNote}>
              iOS WidgetKit (Swift) & Android AppWidget (Kotlin) source files are integrated in the project.
            </Text>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setIsWidgetModalOpen(false)}
            >
              <Text style={styles.modalDoneText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Month History Modal */}
      <Modal visible={isHistoryModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Monthly History & Recap</Text>
              <TouchableOpacity onPress={() => setIsHistoryModalOpen(false)}>
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 350, marginVertical: 10 }}>
              {monthlyOverview.weeklyBreakdown.map((w) => (
                <View key={w.weekNumber} style={styles.historyRow}>
                  <Text style={styles.historyWeekLabel}>{w.weekLabel}</Text>
                  <Text style={styles.historyProgress}>{w.completed} / {w.target} units ({w.percentage}%)</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setIsHistoryModalOpen(false)}
            >
              <Text style={styles.modalDoneText}>Close History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 8 : 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0b0f19'
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff'
  },
  badgeLive: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  badgeLiveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34d399'
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginRight: 6
  },
  iconButtonText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600'
  },
  primaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6366f1',
    borderRadius: 8
  },
  primaryButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700'
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    padding: 16
  },
  overviewCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 16
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#818cf8',
    letterSpacing: 0.5
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2
  },
  percentagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)'
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34d399'
  },
  cardDescription: {
    fontSize: 11,
    color: '#94a3b8',
    marginVertical: 8,
    lineHeight: 16
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6
  },
  statBox: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
    marginRight: 6
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b'
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94a3b8'
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#020617',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 10
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34d399',
    borderRadius: 3
  },
  weekPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  weekBreakdownText: {
    fontSize: 9,
    color: '#64748b'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5
  },
  historyLink: {
    fontSize: 11,
    color: '#818cf8',
    fontWeight: '600'
  },
  weeksScroll: {
    marginBottom: 16
  },
  weekTab: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    width: 140
  },
  weekTabActive: {
    borderColor: '#6366f1',
    backgroundColor: '#1e1b4b'
  },
  weekTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  weekTabTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8'
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399'
  },
  weekTabDates: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  weekTabProgress: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34d399',
    marginTop: 4
  },
  currentWeekBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4338ca',
    marginBottom: 16
  },
  bannerWeekTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  bannerSubtitle: {
    fontSize: 10,
    color: '#a5b4fc',
    marginTop: 2
  },
  bannerProgressText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#34d399'
  },
  bannerProgressSub: {
    fontSize: 10,
    color: '#94a3b8'
  },
  dailyBoard: {
    gap: 12
  },
  dayCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  dayCardToday: {
    borderColor: '#6366f1'
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    paddingBottom: 6
  },
  dayCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff'
  },
  todayPill: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  todayPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff'
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  goalTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0'
  },
  goalQuota: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  stepBtn: {
    width: 24,
    height: 24,
    backgroundColor: '#1e293b',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepBtnText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700'
  },
  checkBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkBtnDone: {
    backgroundColor: '#34d399'
  },
  checkBtnText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700'
  },
  sundayCard: {
    backgroundColor: '#1c1917',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#78350f',
    alignItems: 'center'
  },
  sundayCardTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.5
  },
  sundayCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2
  },
  sundayCardDesc: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 4,
    textAlign: 'center'
  },
  sundayZenCard: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#b45309',
    alignItems: 'center',
    marginBottom: 16
  },
  sundayBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 6
  },
  sundayZenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6
  },
  sundayZenDesc: {
    fontSize: 12,
    color: '#d6d3d1',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12
  },
  sundayRecapBox: {
    backgroundColor: '#0c0a09',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  recapLabel: {
    fontSize: 10,
    color: '#a8a29e'
  },
  recapStat: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
    marginTop: 2
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 20
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },
  closeModalText: {
    fontSize: 18,
    color: '#94a3b8'
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4
  },
  modalGoalItem: {
    padding: 10,
    backgroundColor: '#020617',
    borderRadius: 10,
    marginBottom: 6
  },
  modalGoalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  modalGoalUnit: {
    fontSize: 11,
    color: '#818cf8',
    marginTop: 2
  },
  modalDoneButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10
  },
  modalDoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  widgetMockup: {
    backgroundColor: '#16181b',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#26292d',
    marginVertical: 14
  },
  widgetMockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  widgetWeekText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  widgetMonthBadge: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  widgetMonthBadgeText: {
    fontSize: 10,
    color: '#818cf8',
    fontWeight: '700'
  },
  widgetTodayText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginVertical: 8
  },
  widgetProgressLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 4
  },
  widgetProgressBarBg: {
    height: 5,
    backgroundColor: '#020617',
    borderRadius: 3,
    overflow: 'hidden'
  },
  widgetProgressBarFill: {
    height: '100%',
    backgroundColor: '#34d399'
  },
  widgetNote: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 6
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#1e293b'
  },
  historyWeekLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff'
  },
  historyProgress: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '600'
  },
  bannerEditBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start'
  },
  bannerEditBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818cf8'
  },
  modalWeekTabs: {
    flexDirection: 'row',
    marginVertical: 10
  },
  modalWeekPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    marginRight: 6
  },
  modalWeekPillActive: {
    backgroundColor: '#6366f1'
  },
  modalWeekPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8'
  },
  modalWeekBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4338ca',
    borderRadius: 12,
    padding: 10,
    marginVertical: 6
  },
  modalBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
    flex: 1
  },
  modalBannerSum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#a5b4fc',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  noGoalsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginVertical: 16
  },
  modalGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  modalStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  modalStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalStepBtnText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '700'
  },
  modalTargetVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    minWidth: 26,
    textAlign: 'center'
  },
  modalEditBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#312e81',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2
  },
  modalEditBtnText: {
    fontSize: 12,
    color: '#a5b4fc',
    fontWeight: '700'
  },
  modalDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#3f1515',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2
  },
  modalDeleteBtnText: {
    fontSize: 11,
    color: '#f87171',
    fontWeight: '700'
  },
  editGoalCard: {
    backgroundColor: '#0b0f19',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4f46e5'
  },
  editGoalHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a5b4fc',
    marginBottom: 6
  },
  newGoalForm: {
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 6
  },
  newGoalHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#ffffff'
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b'
  },
  cancelBtnText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600'
  },
  saveGoalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#6366f1'
  },
  saveGoalBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700'
  },
  addGoalTriggerBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4338ca',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    marginVertical: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.05)'
  },
  addGoalTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#818cf8'
  }
});
