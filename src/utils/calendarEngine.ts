import { CalendarDay, DayName, MonthModel, WeekModel } from '../types/tracker';

const DAY_NAMES: DayName[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Returns YYYY-MM-DD string representation in local time
 */
export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parse YYYY-MM-DD into a local Date object
 */
export function fromDateString(str: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if two dates represent the same local calendar day
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Builds the CalendarDay model for a given day
 */
export function createCalendarDay(date: Date, todayDate: Date, weekIndex: number): CalendarDay {
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const dayName = DAY_NAMES[dayOfWeek];
  const dateString = toDateString(date);
  const todayString = toDateString(todayDate);

  const startOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  const startOfThatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  return {
    date: new Date(date),
    dateString,
    dayOfMonth: date.getDate(),
    dayOfWeek,
    dayName,
    isSunday: dayOfWeek === 0,
    isCurrentMonth: true,
    isToday: dateString === todayString,
    isPast: startOfThatDay.getTime() < startOfToday.getTime(),
    weekIndex
  };
}

/**
 * Core Calendar Splitting Engine
 * 
 * Rules:
 * 1. Mon - Sat are active tracking days.
 * 2. Sunday is strictly an OFF / REST day.
 * 3. A week starts on Monday (or the 1st of the month if it begins mid-week).
 * 4. A week completes on Saturday, followed by Sunday as the rest day.
 * 5. If Sunday is the 1st of the month, it acts as the initial Rest Day preceding Week 1.
 * 6. Calculates the exact number of weeks (e.g. 4, 5, or 6 weeks) for any live month.
 */
export function getLiveMonthModel(referenceDate: Date = new Date(), todayDate: Date = new Date()): MonthModel {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth(); // 0-indexed
  const monthName = MONTH_NAMES[monthIndex];
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeks: WeekModel[] = [];

  let currentActiveDays: CalendarDay[] = [];
  let currentSunday: CalendarDay | null = null;
  let weekStartDate: Date | null = null;
  let weekEndDate: Date | null = null;
  let weekNumberCounter = 1;

  for (let day = 1; day <= lastDayOfMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    if (dayOfWeek === 0) {
      // It is Sunday (Rest / Off Day)
      const sundayCalDay = createCalendarDay(d, todayDate, weekNumberCounter - 1);
      
      if (currentActiveDays.length > 0) {
        // Associate Sunday with the week that just completed (Mon-Sat)
        currentSunday = sundayCalDay;
        const weekId = `${monthKey}-w${weekNumberCounter}`;
        
        weeks.push({
          id: weekId,
          weekNumber: weekNumberCounter,
          monthKey,
          label: `Week ${weekNumberCounter}`,
          startDate: weekStartDate || currentActiveDays[0].date,
          endDate: weekEndDate || currentActiveDays[currentActiveDays.length - 1].date,
          startDateString: toDateString(weekStartDate || currentActiveDays[0].date),
          endDateString: toDateString(weekEndDate || currentActiveDays[currentActiveDays.length - 1].date),
          activeDays: [...currentActiveDays],
          sundayDate: currentSunday,
          isCurrentWeek: false, // Calculated below
          isPastWeek: false,
          isFutureWeek: false,
          totalActiveDays: currentActiveDays.length
        });

        // Reset for the next week
        weekNumberCounter++;
        currentActiveDays = [];
        currentSunday = null;
        weekStartDate = null;
        weekEndDate = null;
      } else {
        // Special Edge Case: Month begins on a Sunday (Day 1 is Sunday)
        // This Sunday is the month's opener rest day; we attach it as sundayDate for week 1
        currentSunday = sundayCalDay;
      }
    } else {
      // Monday to Saturday (Active Goal Days)
      if (!weekStartDate) {
        weekStartDate = d;
      }
      weekEndDate = d;

      const calDay = createCalendarDay(d, todayDate, weekNumberCounter - 1);
      currentActiveDays.push(calDay);

      // If this is the last day of the month and it's not Saturday, or next day is the next month
      if (day === lastDayOfMonth) {
        const weekId = `${monthKey}-w${weekNumberCounter}`;
        
        // Check if the next day (Day 1 of next month) is Sunday
        // But for our current month model, only in-month days are counted
        weeks.push({
          id: weekId,
          weekNumber: weekNumberCounter,
          monthKey,
          label: `Week ${weekNumberCounter}`,
          startDate: weekStartDate || currentActiveDays[0].date,
          endDate: weekEndDate || currentActiveDays[currentActiveDays.length - 1].date,
          startDateString: toDateString(weekStartDate || currentActiveDays[0].date),
          endDateString: toDateString(weekEndDate || currentActiveDays[currentActiveDays.length - 1].date),
          activeDays: [...currentActiveDays],
          sundayDate: currentSunday, // Can be null if month ends on Fri/Sat
          isCurrentWeek: false,
          isPastWeek: false,
          isFutureWeek: false,
          totalActiveDays: currentActiveDays.length
        });
      }
    }
  }

  // Identify current, past, and future weeks based on todayDate
  const todayStr = toDateString(todayDate);
  const startOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();

  let foundCurrent = false;

  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i];
    // A week is current if today falls within its active days OR its Sunday rest day
    const hasTodayInActive = w.activeDays.some(d => d.dateString === todayStr);
    const hasTodayInSunday = w.sundayDate?.dateString === todayStr;

    if (hasTodayInActive || hasTodayInSunday) {
      w.isCurrentWeek = true;
      foundCurrent = true;
    } else {
      const endOfThisWeek = w.sundayDate 
        ? new Date(w.sundayDate.date).getTime() 
        : new Date(w.endDate).getTime();
        
      if (endOfThisWeek < startOfToday) {
        w.isPastWeek = true;
      } else {
        w.isFutureWeek = true;
      }
    }
  }

  // If today is in another month, default to week 1 or last week
  if (!foundCurrent && weeks.length > 0) {
    if (startOfToday < new Date(weeks[0].startDate).getTime()) {
      weeks[0].isCurrentWeek = true;
    } else {
      weeks[weeks.length - 1].isCurrentWeek = true;
    }
  }

  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();

  return {
    year,
    monthIndex,
    monthName,
    monthKey,
    totalDays: lastDayOfMonth,
    weeksCount: weeks.length,
    weeks,
    firstDayOfWeek
  };
}

/**
 * Returns formatted friendly date range for a week (e.g. "Mon, Oct 5 – Sat, Oct 10")
 */
export function formatWeekRange(week: WeekModel): string {
  const startStr = week.startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const endStr = week.endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${startStr} – ${endStr}`;
}
