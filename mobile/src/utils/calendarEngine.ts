import { CalendarDay, DayName, MonthModel, WeekModel } from '../types/tracker';

const DAY_NAMES: DayName[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function toDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateString(str: string): Date {
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function createCalendarDay(date: Date, todayDate: Date, weekIndex: number): CalendarDay {
  const dayOfWeek = date.getDay();
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

export function getLiveMonthModel(referenceDate: Date = new Date(), todayDate: Date = new Date()): MonthModel {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
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
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 0) {
      // Sunday: Rest / Off Day
      const sundayCalDay = createCalendarDay(d, todayDate, weekNumberCounter - 1);
      
      if (currentActiveDays.length > 0) {
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
          isCurrentWeek: false,
          isPastWeek: false,
          isFutureWeek: false,
          totalActiveDays: currentActiveDays.length
        });

        weekNumberCounter++;
        currentActiveDays = [];
        currentSunday = null;
        weekStartDate = null;
        weekEndDate = null;
      } else {
        currentSunday = sundayCalDay;
      }
    } else {
      // Monday to Saturday (Active Goal Days)
      if (!weekStartDate) weekStartDate = d;
      weekEndDate = d;

      const calDay = createCalendarDay(d, todayDate, weekNumberCounter - 1);
      currentActiveDays.push(calDay);

      if (day === lastDayOfMonth) {
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
          isCurrentWeek: false,
          isPastWeek: false,
          isFutureWeek: false,
          totalActiveDays: currentActiveDays.length
        });
      }
    }
  }

  const todayStr = toDateString(todayDate);
  const startOfToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();

  let foundCurrent = false;

  for (let i = 0; i < weeks.length; i++) {
    const w = weeks[i];
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

  if (!foundCurrent && weeks.length > 0) {
    if (startOfToday < new Date(weeks[0].startDate).getTime()) {
      weeks[0].isCurrentWeek = true;
    } else {
      weeks[weeks.length - 1].isCurrentWeek = true;
    }
  }

  return {
    year,
    monthIndex,
    monthName,
    monthKey,
    totalDays: lastDayOfMonth,
    weeksCount: weeks.length,
    weeks,
    firstDayOfWeek: new Date(year, monthIndex, 1).getDay()
  };
}

export function formatWeekRange(week: WeekModel): string {
  const startStr = week.startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const endStr = week.endDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${startStr} – ${endStr}`;
}
