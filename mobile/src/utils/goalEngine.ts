import { GoalItem, MonthModel, MonthlyGoalOverview, WeekModel, WidgetPayload } from '../types/tracker';
import { toDateString } from './calendarEngine';

export function calculateWeeklySums(goals: GoalItem[]): { targetSum: number; completedSum: number; percentage: number } {
  let targetSum = 0;
  let completedSum = 0;

  for (const g of goals) {
    targetSum += g.weeklyTarget;
    const goalCompleted = Object.values(g.completed || {}).reduce((acc, val) => acc + (val || 0), 0);
    completedSum += goalCompleted;
  }

  const percentage = targetSum > 0 ? Math.min(100, Math.round((completedSum / targetSum) * 100)) : 0;
  return { targetSum, completedSum, percentage };
}

export function calculateMonthlyOverview(
  month: MonthModel,
  weeklyGoalsMap: Record<string, GoalItem[]>
): MonthlyGoalOverview {
  let totalMonthlyTarget = 0;
  let totalMonthlyCompleted = 0;

  const weeklyBreakdown = month.weeks.map(week => {
    const goals = weeklyGoalsMap[week.id] || [];
    const { targetSum, completedSum, percentage } = calculateWeeklySums(goals);

    totalMonthlyTarget += targetSum;
    totalMonthlyCompleted += completedSum;

    return {
      weekNumber: week.weekNumber,
      weekLabel: week.label,
      target: targetSum,
      completed: completedSum,
      percentage,
      goalsCount: goals.length,
      isCurrent: week.isCurrentWeek,
      isPast: week.isPastWeek
    };
  });

  const progressPercentage = totalMonthlyTarget > 0 
    ? Math.min(100, Math.round((totalMonthlyCompleted / totalMonthlyTarget) * 100)) 
    : 0;

  return {
    monthKey: month.monthKey,
    monthName: month.monthName,
    year: month.year,
    totalMonthlyTarget,
    totalMonthlyCompleted,
    progressPercentage,
    weeklyBreakdown
  };
}

export function createDefaultGoalsForWeek(week: WeekModel): GoalItem[] {
  const activeDates = week.activeDays.map(d => d.dateString);
  const activeCount = Math.max(1, activeDates.length);

  const deepWorkTarget = activeCount * 4;
  const deepDailyTargets: Record<string, number> = {};
  const deepCompleted: Record<string, number> = {};
  activeDates.forEach((d, idx) => {
    deepDailyTargets[d] = 4;
    if (week.activeDays[idx].isPast) deepCompleted[d] = 4;
  });

  const fitnessDailyTargets: Record<string, number> = {};
  const fitnessCompleted: Record<string, number> = {};
  activeDates.forEach((d, idx) => {
    fitnessDailyTargets[d] = 1;
    if (week.activeDays[idx].isPast && idx % 2 === 0) fitnessCompleted[d] = 1;
  });

  const readingDailyTargets: Record<string, number> = {};
  const readingCompleted: Record<string, number> = {};
  activeDates.forEach((d, idx) => {
    readingDailyTargets[d] = 20;
    if (week.activeDays[idx].isPast) readingCompleted[d] = 20;
  });

  const healthDailyTargets: Record<string, number> = {};
  const healthCompleted: Record<string, number> = {};
  activeDates.forEach((d, idx) => {
    healthDailyTargets[d] = 3;
    if (week.activeDays[idx].isPast) healthCompleted[d] = 3;
  });

  return [
    {
      id: `${week.id}-g1`,
      weekId: week.id,
      title: 'Deep Focus & Development',
      category: 'work',
      unit: 'hrs',
      weeklyTarget: deepWorkTarget,
      dailyTargets: deepDailyTargets,
      completed: deepCompleted,
      color: '#3b82f6',
      icon: 'brain'
    },
    {
      id: `${week.id}-g2`,
      weekId: week.id,
      title: 'Gym & Cardio Session',
      category: 'fitness',
      unit: 'sessions',
      weeklyTarget: Math.min(activeCount, 5),
      dailyTargets: fitnessDailyTargets,
      completed: fitnessCompleted,
      color: '#10b981',
      icon: 'dumbbell'
    },
    {
      id: `${week.id}-g3`,
      weekId: week.id,
      title: 'Book & Paper Reading',
      category: 'learning',
      unit: 'pages',
      weeklyTarget: activeCount * 20,
      dailyTargets: readingDailyTargets,
      completed: readingCompleted,
      color: '#8b5cf6',
      icon: 'book'
    },
    {
      id: `${week.id}-g4`,
      weekId: week.id,
      title: 'Hydration & Nutrition (3L)',
      category: 'health',
      unit: 'litres',
      weeklyTarget: activeCount * 3,
      dailyTargets: healthDailyTargets,
      completed: healthCompleted,
      color: '#06b6d4',
      icon: 'droplet'
    }
  ];
}

export function buildWidgetPayload(
  month: MonthModel,
  weeklyGoalsMap: Record<string, GoalItem[]>,
  todayDate: Date
): WidgetPayload {
  const todayStr = toDateString(todayDate);
  const currentWeek = month.weeks.find(w => w.isCurrentWeek) || month.weeks[0];
  const isSunday = todayDate.getDay() === 0;

  const currentGoals = weeklyGoalsMap[currentWeek.id] || [];
  const { targetSum: weekTarget, completedSum: weekCompleted, percentage: weekProgress } = calculateWeeklySums(currentGoals);
  const monthlyOverview = calculateMonthlyOverview(month, weeklyGoalsMap);

  const activeTodayGoals = currentGoals.map(g => {
    const target = g.dailyTargets[todayStr] ?? 0;
    const completed = g.completed[todayStr] ?? 0;
    const isDone = target > 0 ? completed >= target : false;

    return {
      id: g.id,
      title: g.title,
      target,
      completed,
      unit: g.unit,
      isDone,
      category: g.category
    };
  });

  const todayCompletedCount = activeTodayGoals.filter(g => g.isDone).length;
  const todayTotalCount = activeTodayGoals.filter(g => g.target > 0).length;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = dayNames[todayDate.getDay()];

  return {
    lastUpdated: new Date().toISOString(),
    monthName: month.monthName,
    currentWeekNumber: currentWeek.weekNumber,
    currentWeekLabel: currentWeek.label,
    weekDateRange: `${currentWeek.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${currentWeek.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    todayDateString: todayStr,
    todayDayName,
    isSunday,
    todayTargetSummary: isSunday 
      ? 'Rest & Recharge Day' 
      : `${todayCompletedCount} of ${todayTotalCount} targets met today`,
    todayCompletedCount,
    todayTotalCount,
    currentWeekProgress: weekProgress,
    currentWeekTarget: weekTarget,
    currentWeekCompleted: weekCompleted,
    monthlyProgress: monthlyOverview.progressPercentage,
    monthlyTarget: monthlyOverview.totalMonthlyTarget,
    monthlyCompleted: monthlyOverview.totalMonthlyCompleted,
    activeTodayGoals
  };
}
