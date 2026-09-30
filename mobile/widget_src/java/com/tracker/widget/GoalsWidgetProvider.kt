package com.tracker.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject

class GoalsWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val prefs = context.getSharedPreferences("GoalTrackerPrefs", Context.MODE_PRIVATE)
        val jsonPayload = prefs.getString("home_screen_widget_payload", null)

        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId, jsonPayload)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        jsonPayload: String?
    ) {
        val views = RemoteViews(context.packageName, context.resources.getIdentifier("widget_goals_medium", "layout", context.packageName))

        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent()
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(context.resources.getIdentifier("widget_root", "id", context.packageName), pendingIntent)

        if (jsonPayload != null) {
            try {
                val json = JSONObject(jsonPayload)
                val currentWeekLabel = json.optString("currentWeekLabel", "Week 1")
                val todayDayName = json.optString("todayDayName", "Today")
                val isSunday = json.optBoolean("isSunday", false)
                val currentWeekProgress = json.optInt("currentWeekProgress", 0)
                val monthlyProgress = json.optInt("monthlyProgress", 0)

                views.setTextViewText(
                    context.resources.getIdentifier("tv_week_label", "id", context.packageName),
                    "$currentWeekLabel • $todayDayName"
                )
                views.setTextViewText(
                    context.resources.getIdentifier("tv_monthly_indicator", "id", context.packageName),
                    "Month: $monthlyProgress%"
                )

                val tvSundayNoticeId = context.resources.getIdentifier("tv_sunday_rest", "id", context.packageName)
                val layoutGoalsId = context.resources.getIdentifier("layout_active_goals", "id", context.packageName)

                if (isSunday) {
                    views.setViewVisibility(tvSundayNoticeId, View.VISIBLE)
                    views.setViewVisibility(layoutGoalsId, View.GONE)
                    views.setTextViewText(
                        tvSundayNoticeId,
                        "☕ Sunday OFF / REST DAY\nNo active tracking required today. Rest & recharge."
                    )
                } else {
                    views.setViewVisibility(tvSundayNoticeId, View.GONE)
                    views.setViewVisibility(layoutGoalsId, View.VISIBLE)

                    val goalsArray = json.optJSONArray("activeTodayGoals")
                    val goal1Id = context.resources.getIdentifier("tv_goal_item_1", "id", context.packageName)
                    val goal2Id = context.resources.getIdentifier("tv_goal_item_2", "id", context.packageName)

                    if (goalsArray != null && goalsArray.length() > 0) {
                        val g1 = goalsArray.getJSONObject(0)
                        val g1Text = "${if (g1.optBoolean("isDone")) "✓ " else "○ "}${g1.optString("title")}: ${g1.optInt("completed")}/${g1.optInt("target")} ${g1.optString("unit")}"
                        views.setTextViewText(goal1Id, g1Text)

                        if (goalsArray.length() > 1) {
                            val g2 = goalsArray.getJSONObject(1)
                            val g2Text = "${if (g2.optBoolean("isDone")) "✓ " else "○ "}${g2.optString("title")}: ${g2.optInt("completed")}/${g2.optInt("target")} ${g2.optString("unit")}"
                            views.setTextViewText(goal2Id, g2Text)
                        }
                    }
                }

                val progressBarId = context.resources.getIdentifier("progress_week", "id", context.packageName)
                val tvWeekPercentId = context.resources.getIdentifier("tv_week_percent", "id", context.packageName)

                views.setProgressBar(progressBarId, 100, currentWeekProgress, false)
                views.setTextViewText(tvWeekPercentId, "$currentWeekProgress%")

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
