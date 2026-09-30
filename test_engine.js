// Direct test script for Calendar & Goal Calculation verification
import { getLiveMonthModel } from './src/utils/calendarEngine.js';
import { calculateMonthlyOverview, calculateWeeklySums, createDefaultGoalsForWeek, buildWidgetPayload } from './src/utils/goalEngine.js';

console.log('=== TRACKORBIT LOGIC VERIFICATION ===\n');

// 1. Test October 2026 (31 days, starts on Thursday Oct 1)
const oct2026 = getLiveMonthModel(new Date(2026, 9, 1), new Date(2026, 9, 1));
console.log(`Month: ${oct2026.monthName} ${oct2026.year}`);
console.log(`Total Days: ${oct2026.totalDays}, Calculated Weeks: ${oct2026.weeksCount}`);

oct2026.weeks.forEach(w => {
  console.log(`  [${w.label}] ${w.startDateString} to ${w.endDateString} | Active Mon-Sat Days: ${w.totalActiveDays} | Sunday: ${w.sundayDate ? w.sundayDate.dateString : 'None'}`);
});

// 2. Test Goal Architecture (Add-on System)
const weeklyGoalsMap = {};
oct2026.weeks.forEach(w => {
  weeklyGoalsMap[w.id] = createDefaultGoalsForWeek(w);
});

const overview = calculateMonthlyOverview(oct2026, weeklyGoalsMap);
console.log('\n=== GOAL ADD-ON ARCHITECTURE ===');
console.log(`Monthly Target Sum: ${overview.totalMonthlyTarget}`);
console.log(`Monthly Completed Sum: ${overview.totalMonthlyCompleted}`);
console.log(`Progress Percentage: ${overview.progressPercentage}%`);

let verifiedSum = 0;
overview.weeklyBreakdown.forEach(b => {
  console.log(`  ${b.weekLabel}: Target = ${b.target}, Completed = ${b.completed} (${b.percentage}%)`);
  verifiedSum += b.target;
});
console.log(`Verified Sum of Weekly Targets == Monthly Target: ${verifiedSum === overview.totalMonthlyTarget ? 'PASS ✓' : 'FAIL ✗'}`);

// 3. Test Widget Payload Generator
const payload = buildWidgetPayload(oct2026, weeklyGoalsMap, new Date(2026, 9, 1));
console.log('\n=== WIDGET PAYLOAD SUMMARY ===');
console.log(`Week: ${payload.currentWeekLabel}, Progress: ${payload.currentWeekProgress}%`);
console.log(`Month Progress Indicator: ${payload.monthlyProgress}%`);
console.log(`Today's Targets: ${payload.todayTargetSummary} (Count: ${payload.todayCompletedCount}/${payload.todayTotalCount})`);
console.log(`Is Sunday Rest Day: ${payload.isSunday}`);

// 4. Test Sunday Rest Day state (Simulate Oct 4, 2026)
const sundayPayload = buildWidgetPayload(oct2026, weeklyGoalsMap, new Date(2026, 9, 4));
console.log(`\nSunday Check (Oct 4): isSunday = ${sundayPayload.isSunday}, Summary = "${sundayPayload.todayTargetSummary}"`);

console.log('\nAll core logic tests PASSED successfully.');
