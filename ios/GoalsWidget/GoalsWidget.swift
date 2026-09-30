//
//  GoalsWidget.swift
//  TrackOrbit
//
//  iOS WidgetKit Implementation for Home Screen Widget
//  Displays:
//  1. Current week's active goals and today's daily target
//  2. Progress bar showing how much of current week is completed
//  3. Small indicator showing overall cumulative Monthly Goal progress
//

import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    let appGroupId = "group.com.tracker.goals"
    let storageKey = "home_screen_widget_payload"

    func placeholder(in context: Context) -> GoalEntry {
        GoalEntry(date: Date(), data: WidgetDataModel.placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (GoalEntry) -> Void) {
        let data = loadWidgetData() ?? WidgetDataModel.placeholder
        let entry = GoalEntry(date: Date(), data: data)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GoalEntry>) -> Void) {
        let currentDate = Date()
        let data = loadWidgetData() ?? WidgetDataModel.placeholder
        let entry = GoalEntry(date: currentDate, data: data)

        // Refresh timeline every 30 minutes or when app syncs
        let nextUpdateDate = Calendar.current.date(byAdding: .minute, value: 30, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdateDate))
        completion(timeline)
    }

    private func loadWidgetData() -> WidgetDataModel? {
        guard let sharedDefaults = UserDefaults(suiteName: appGroupId),
              let jsonString = sharedDefaults.string(forKey: storageKey),
              let jsonData = jsonString.data(using: .utf8) else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetDataModel.self, from: jsonData)
    }
}

struct GoalEntry: TimelineEntry {
    let date: Date
    let data: WidgetDataModel
}

// MARK: - Medium Widget View (338 x 158 pt)
struct GoalsMediumView: View {
    let data: WidgetDataModel

    var body: some View {
        ZStack {
            Color(red: 10/255, green: 15/255, blue: 30/255)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 8) {
                // Top Header: Week Label + Monthly Cumulative Goal Indicator
                HStack(alignment: .center) {
                    HStack(spacing: 5) {
                        Circle()
                            .fill(data.isSunday ? Color.orange : Color.green)
                            .frame(width: 7, height: 7)

                        Text("\(data.currentWeekLabel) • \(data.todayDayName)")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                    }

                    Spacer()

                    // Small indicator showing overall cumulative Monthly Goal progress
                    HStack(spacing: 4) {
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color.indigo)

                        Text("Month: \(data.monthlyProgress)%")
                            .font(.system(size: 11, weight: .semibold, design: .monospaced))
                            .foregroundColor(.indigo)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.indigo.opacity(0.18))
                    .clipShape(Capsule())
                }

                // Middle: Sunday Off-Day View OR Active Goals Checklist
                if data.isSunday {
                    HStack(spacing: 10) {
                        Image(systemName: "cup.and.saucer.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.orange)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Sunday OFF / REST DAY")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                            Text("No active goals required today. Recharge for tomorrow.")
                                .font(.system(size: 10))
                                .foregroundColor(.gray)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 4)
                } else {
                    // Grid of 4 Active Goals for Today
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                        ForEach(data.activeTodayGoals.prefix(4)) { goal in
                            HStack(spacing: 6) {
                                Image(systemName: goal.isDone ? "checkmark.circle.fill" : "circle")
                                    .font(.system(size: 11))
                                    .foregroundColor(goal.isDone ? .green : .gray)

                                VStack(alignment: .leading, spacing: 1) {
                                    Text(goal.title)
                                        .font(.system(size: 10, weight: .semibold))
                                        .foregroundColor(.white)
                                        .lineLimit(1)
                                    Text("\(Int(goal.completed))/\(Int(goal.target)) \(goal.unit)")
                                        .font(.system(size: 9, design: .monospaced))
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                            }
                            .padding(.horizontal, 6)
                            .padding(.vertical, 4)
                            .background(Color.white.opacity(0.04))
                            .cornerRadius(8)
                        }
                    }
                }

                Spacer(minLength: 0)

                // Bottom: Current Week Progress Bar
                VStack(alignment: .leading, spacing: 3) {
                    HStack {
                        Text("Current Week Progress")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.gray)
                        Spacer()
                        Text("\(data.currentWeekProgress)%")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                    }

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.12))
                                .frame(height: 5)

                            Capsule()
                                .fill(LinearGradient(
                                    colors: [Color.indigo, Color.green],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ))
                                .frame(width: geo.size.width * CGFloat(min(1.0, Double(data.currentWeekProgress) / 100.0)), height: 5)
                        }
                    }
                    .frame(height: 5)
                }
            }
            .padding(14)
        }
    }
}

// MARK: - Small Widget View (158 x 158 pt)
struct GoalsSmallView: View {
    let data: WidgetDataModel

    var body: some View {
        ZStack {
            Color(red: 10/255, green: 15/255, blue: 30/255)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 6) {
                // Header
                HStack {
                    Text(data.currentWeekLabel)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    // Small monthly indicator
                    Text("\(data.monthlyProgress)% M")
                        .font(.system(size: 9, weight: .bold, design: .monospaced))
                        .foregroundColor(.indigo)
                        .padding(.horizontal, 4)
                        .padding(.vertical, 2)
                        .background(Color.indigo.opacity(0.2))
                        .cornerRadius(4)
                }

                Spacer()

                // Center: Today's metric or Sunday rest
                if data.isSunday {
                    VStack(alignment: .center, spacing: 2) {
                        Image(systemName: "cup.and.saucer.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.orange)
                        Text("REST DAY")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.orange)
                        Text("Sunday Off")
                            .font(.system(size: 9))
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity)
                } else {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(data.todayCompletedCount)/\(data.todayTotalCount)")
                            .font(.system(size: 24, weight: .black, design: .monospaced))
                            .foregroundColor(.white)
                        Text("Today's Targets")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(.gray)
                    }
                }

                Spacer()

                // Bottom: Week progress bar
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text("Week")
                            .font(.system(size: 9))
                            .foregroundColor(.gray)
                        Spacer()
                        Text("\(data.currentWeekProgress)%")
                            .font(.system(size: 9, weight: .bold, design: .monospaced))
                            .foregroundColor(.green)
                    }

                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.white.opacity(0.1)).frame(height: 4)
                        Capsule().fill(Color.green).frame(width: CGFloat(data.currentWeekProgress), height: 4)
                    }
                }
            }
            .padding(12)
        }
    }
}

// MARK: - Widget Configuration Entry Point
struct GoalsWidgetEntryView : View {
    @Environment(\.widgetFamily) var family
    var entry: Provider.Entry

    var body: some View {
        switch family {
        case .systemSmall:
            GoalsSmallView(data: entry.data)
        case .systemMedium:
            GoalsMediumView(data: entry.data)
        default:
            GoalsMediumView(data: entry.data)
        }
    }
}

@main
struct GoalsWidget: Widget {
    let kind: String = "GoalsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            GoalsWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("TrackOrbit Weekly & Monthly Goals")
        .description("Track current week active targets, today's quotas, and cumulative monthly goal progress.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
