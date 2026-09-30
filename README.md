# TrackOrbit — Live Calendar Month Goal Tracker with Home Screen Widget

A cross-platform goal tracking application built around **live calendar months**, **Monday-to-Saturday weekly sprints**, **strict Sunday rest/recovery days**, and a **cumulative add-on goal architecture**, complete with native **Apple iOS (WidgetKit/SwiftUI)** and **Android (AppWidget/Kotlin)** Home Screen Widgets.

---

## 1. System Architecture & Core Logic

### A. Live Calendar Splitting Engine (`src/utils/calendarEngine.ts`)
* **Dynamic Month Resolution:** Fetches the current live month dynamically based on device local time.
* **Sprint Definition:** A week runs strictly from **Monday to Saturday** (active tracking days).
* **Sunday Protocol:** Sunday is strictly an **OFF / REST DAY**. No active tracking is required or enforced.
* **Variable Week Calculation:** Dynamically calculates the exact number of weeks (or partial weeks) in that specific month (e.g., 3, 4, 5, or 6 weeks) based on:
  - First day of the month (e.g., if a month starts on Thursday, Week 1 is Thursday to Saturday — 3 active days — followed by Sunday as a rest day).
  - Number of days in the month (28, 29, 30, or 31).
  - Last day of the month (partial ending weeks are cleanly bounded).
* **Rollover Rule:** The current week's view stays active dynamically until the calendar rolls over to Monday 00:00:00.

### B. Goal Architecture: The Add-on System (`src/utils/goalEngine.ts`)
$$\text{Monthly Goal Target} = \sum_{w=1}^{N} \text{Weekly Goal Target}_w$$
$$\text{Monthly Completed Units} = \sum_{w=1}^{N} \text{Weekly Completed Units}_w$$
$$\text{Cumulative Monthly Progress} = \left(\frac{\text{Monthly Completed Units}}{\text{Monthly Goal Target}}\right) \times 100\%$$

* **Unique Weekly Decision:** Users can manually define and customize specific goals for **EACH individual week**.
* **Progress Accumulation:** As each week progresses, completed units accumulate into the monthly master milestone.
* **Daily Split:** Each weekly goal is subdivided into daily actionable quotas across Monday through Saturday.

---

## 2. Project Folder Structure

```
y:/tracker/
├── index.html                           # App HTML Entry with Google Fonts & Tailwind CDN
├── package.json                         # Dependencies & Scripts
├── tsconfig.json                        # TypeScript Configuration
├── vite.config.ts                       # Vite Configuration
├── test_engine.js                       # Calendar & Goal Engine automated test script
│
├── src/
│   ├── main.tsx                         # React 19 bootstrap
│   ├── App.tsx                          # Main Dashboard Controller
│   ├── index.css                        # Glassmorphism tokens & custom styling
│   │
│   ├── types/
│   │   └── tracker.ts                   # Types: CalendarDay, WeekModel, MonthModel, GoalItem, WidgetPayload
│   │
│   ├── utils/
│   │   ├── calendarEngine.ts            # Live month splitter (Mon-Sat, Sun rest, exact weeks calculation)
│   │   └── goalEngine.ts                # Add-on system math, weekly sums & widget payload builder
│   │
│   ├── services/
│   │   ├── db.ts                        # Local storage service & SQLite Schema specification
│   │   └── widgetBridge.ts              # iOS AppGroup & Android SharedPreferences sync bridge
│   │
│   ├── components/
│   │   ├── Icons.tsx                    # Crisp SVG Icon set (no external icon glitches)
│   │   ├── Header.tsx                   # Live month header, date simulation controls & action buttons
│   │   ├── MonthlyOverviewCard.tsx      # Add-on accumulator, radial progress ring, multi-week breakdown
│   │   ├── WeekTabs.tsx                 # Week 1..N tabs with active indicators & progress bars
│   │   ├── CurrentWeekBanner.tsx        # Active sprint banner, rollover status & target metrics
│   │   ├── DailyTaskBoard.tsx           # Mon–Sat actionable tasks + Sunday Rest Day card
│   │   ├── SundayRestView.tsx           # Zen sanctuary mode for Sunday off-days & weekly recap
│   │   ├── GoalPlannerModal.tsx         # Weekly goal customization & quota manager
│   │   ├── PastWeeksHistoryModal.tsx    # Historical performance & cumulative monthly add-on timeline
│   │   └── WidgetSimulatorModal.tsx     # Interactive iOS & Android Home Screen Widget Sandbox
│   │
│   └── native/
│       └── GoalTrackerWidgetModule.ts   # React Native bridge documentation & code
│
├── ios/
│   ├── Shared/
│   │   └── WidgetDataModel.swift        # Swift Codable struct for widget payload
│   └── GoalsWidget/
│       ├── GoalsWidget.swift            # SwiftUI WidgetKit implementation (Small & Medium layouts)
│       └── Info.plist                   # iOS Widget extension configuration
│
└── android/
    └── app/src/main/
        ├── java/com/tracker/widget/
        │   └── GoalsWidgetProvider.kt   # Kotlin AppWidgetProvider with RemoteViews & click intents
        └── res/
            ├── layout/
            │   ├── widget_goals_medium.xml # Android Material You Medium Widget layout
            │   └── widget_goals_small.xml  # Android Material You Small Widget layout
            └── xml/
                └── goals_widget_info.xml   # AppWidget provider metadata
```

---

## 3. Home Screen Widget Implementation

The widget displays:
1. **The current week's active goals and today's daily target.**
2. **A progress bar showing how much of the current week is completed.**
3. **A small indicator showing the overall cumulative Monthly Goal progress.**

### Apple iOS (SwiftUI + WidgetKit)
* Location: `ios/GoalsWidget/GoalsWidget.swift`
* Protocol: `TimelineProvider` loading from `UserDefaults(suiteName: "group.com.tracker.goals")`.
* Supported Sizes:
  - `systemSmall`: Shows week label, small monthly indicator pill (`64% M`), today's targets metric, and weekly completion bar.
  - `systemMedium`: Split card featuring active goals checklist with checkboxes, Sunday rest day status, and dual progress bars (Week + Month).

### Android (Kotlin + AppWidgetProvider)
* Location: `android/app/src/main/java/com/tracker/widget/GoalsWidgetProvider.kt`
* Provider: Extends `AppWidgetProvider`, reading `home_screen_widget_payload` from `SharedPreferences`.
* Layouts: `widget_goals_medium.xml` and `widget_goals_small.xml` with Material You dynamic dark styling.

---

## 4. Running the Project

### A. Web Application & Widget Simulator
The web dashboard & widget simulator is running on:
```bash
npm run dev
# Server URL: http://localhost:3000/
```

### B. Mobile Application (React Native / Expo)
The mobile app is located in `mobile/` and pre-configured with `expo-sqlite`, `@react-native-async-storage/async-storage`, and native widget bridges:
```bash
# Start Expo Metro Bundler (runs on Expo Go / iOS / Android)
npm run mobile

# Run on Android Emulator / Device
npm run mobile:android

# Run on iOS Simulator (macOS)
npm run mobile:ios
```

### C. Logic Engine Verification Tests
Run the standalone verification suite:
```bash
npx tsx test_engine.js
```
