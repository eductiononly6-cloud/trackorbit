export type DayName = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  dayName: DayName;
  isSunday: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  weekIndex: number;
}

export interface WeekModel {
  id: string; // e.g., "2026-10-w1"
  weekNumber: number; // 1, 2, 3, 4, 5
  monthKey: string; // "2026-10"
  label: string; // "Week 1"
  startDate: Date;
  endDate: Date;
  startDateString: string; // "YYYY-MM-DD"
  endDateString: string; // "YYYY-MM-DD"
  activeDays: CalendarDay[]; // Mon - Sat days within this month
  sundayDate: CalendarDay | null; // Sunday rest day corresponding to this week
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  isFutureWeek: boolean;
  totalActiveDays: number;
}

export interface MonthModel {
  year: number;
  monthIndex: number; // 0 - 11
  monthName: string; // "October"
  monthKey: string; // "2026-10"
  totalDays: number;
  weeksCount: number;
  weeks: WeekModel[];
  firstDayOfWeek: number;
}

export type GoalCategory = 'fitness' | 'learning' | 'work' | 'health' | 'mindset' | 'custom';

export interface GoalItem {
  id: string;
  weekId: string; // Links to WeekModel.id
  title: string;
  category: GoalCategory;
  unit: string; // "hrs", "km", "sessions", "tasks", "pages"
  weeklyTarget: number; // e.g. 15 hours
  dailyTargets: Record<string, number>; // dateString -> target amount for that day (Mon-Sat)
  completed: Record<string, number>; // dateString -> completed amount for that day
  color: string;
  icon: string;
  isCompleted?: boolean;
}

export interface WeeklyGoalSet {
  weekId: string;
  weekNumber: number;
  monthKey: string;
  goals: GoalItem[];
  weeklyTargetSum: number;
  weeklyCompletedSum: number;
  progressPercentage: number;
}

export interface MonthlyGoalOverview {
  monthKey: string;
  monthName: string;
  year: number;
  totalMonthlyTarget: number; // Sum of all weekly targets
  totalMonthlyCompleted: number; // Sum of all weekly completed
  progressPercentage: number;
  weeklyBreakdown: {
    weekNumber: number;
    weekLabel: string;
    target: number;
    completed: number;
    percentage: number;
    goalsCount: number;
    isCurrent: boolean;
    isPast: boolean;
  }[];
}

export interface WidgetPayload {
  lastUpdated: string;
  monthName: string;
  currentWeekNumber: number;
  currentWeekLabel: string;
  weekDateRange: string;
  todayDateString: string;
  todayDayName: string;
  isSunday: boolean;
  todayTargetSummary: string;
  todayCompletedCount: number;
  todayTotalCount: number;
  currentWeekProgress: number; // 0 - 100
  currentWeekTarget: number;
  currentWeekCompleted: number;
  monthlyProgress: number; // 0 - 100
  monthlyTarget: number;
  monthlyCompleted: number;
  activeTodayGoals: {
    id: string;
    title: string;
    target: number;
    completed: number;
    unit: string;
    isDone: boolean;
    category: string;
  }[];
}
