//
//  WidgetDataModel.swift
//  TrackOrbit
//
//  Shared data model matching JSON synced from the Goal Tracking Engine.
//

import Foundation

public struct GoalItemModel: Codable, Identifiable {
    public let id: String
    public let title: String
    public let target: Double
    public let completed: Double
    public let unit: String
    public let isDone: Bool
    public let category: String
}

public struct WidgetDataModel: Codable {
    public let lastUpdated: String
    public let monthName: String
    public let currentWeekNumber: Int
    public let currentWeekLabel: String
    public let weekDateRange: String
    public let todayDateString: String
    public let todayDayName: String
    public let isSunday: Bool
    public let todayTargetSummary: String
    public let todayCompletedCount: Int
    public let todayTotalCount: Int
    public let currentWeekProgress: Int // 0 - 100
    public let currentWeekTarget: Double
    public let currentWeekCompleted: Double
    public let monthlyProgress: Int // 0 - 100
    public let monthlyTarget: Double
    public let monthlyCompleted: Double
    public let activeTodayGoals: [GoalItemModel]

    public static var placeholder: WidgetDataModel {
        WidgetDataModel(
            lastUpdated: ISO8601DateFormatter().string(from: Date()),
            monthName: "October",
            currentWeekNumber: 1,
            currentWeekLabel: "Week 1",
            weekDateRange: "Oct 1 - Oct 3",
            todayDateString: "2026-10-01",
            todayDayName: "Thursday",
            isSunday: false,
            todayTargetSummary: "3 of 4 targets completed",
            todayCompletedCount: 3,
            todayTotalCount: 4,
            currentWeekProgress: 75,
            currentWeekTarget: 24.0,
            currentWeekCompleted: 18.0,
            monthlyProgress: 64,
            monthlyTarget: 120.0,
            monthlyCompleted: 77.0,
            activeTodayGoals: [
                GoalItemModel(id: "1", title: "Deep Work", target: 4.0, completed: 4.0, unit: "hrs", isDone: true, category: "work"),
                GoalItemModel(id: "2", title: "Gym Workout", target: 1.0, completed: 1.0, unit: "session", isDone: true, category: "fitness"),
                GoalItemModel(id: "3", title: "Read Book", target: 20.0, completed: 20.0, unit: "pages", isDone: true, category: "learning"),
                GoalItemModel(id: "4", title: "Hydration (3L)", target: 3.0, completed: 2.0, unit: "L", isDone: false, category: "health")
            ]
        )
    }

    public static var sundayRestPlaceholder: WidgetDataModel {
        WidgetDataModel(
            lastUpdated: ISO8601DateFormatter().string(from: Date()),
            monthName: "October",
            currentWeekNumber: 1,
            currentWeekLabel: "Week 1",
            weekDateRange: "Oct 1 - Oct 3",
            todayDateString: "2026-10-04",
            todayDayName: "Sunday",
            isSunday: true,
            todayTargetSummary: "Rest & Recharge Day",
            todayCompletedCount: 0,
            todayTotalCount: 0,
            currentWeekProgress: 100,
            currentWeekTarget: 24.0,
            currentWeekCompleted: 24.0,
            monthlyProgress: 68,
            monthlyTarget: 120.0,
            monthlyCompleted: 82.0,
            activeTodayGoals: []
        )
    }
}
