import { GoalItem } from '../types/tracker';

/**
 * SQLITE SCHEMA SPECIFICATION FOR NATIVE (iOS / Android / React Native)
 * 
 * -- Months table
 * CREATE TABLE IF NOT EXISTS months (
 *   month_key TEXT PRIMARY KEY, -- e.g. '2026-10'
 *   year INTEGER NOT NULL,
 *   month_index INTEGER NOT NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 * 
 * -- Weeks table
 * CREATE TABLE IF NOT EXISTS weeks (
 *   id TEXT PRIMARY KEY, -- e.g. '2026-10-w1'
 *   month_key TEXT NOT NULL,
 *   week_number INTEGER NOT NULL,
 *   start_date TEXT NOT NULL,
 *   end_date TEXT NOT NULL,
 *   sunday_date TEXT,
 *   FOREIGN KEY(month_key) REFERENCES months(month_key) ON DELETE CASCADE
 * );
 * 
 * -- Goals table (Each week has unique goals decided by the user)
 * CREATE TABLE IF NOT EXISTS goals (
 *   id TEXT PRIMARY KEY,
 *   week_id TEXT NOT NULL,
 *   title TEXT NOT NULL,
 *   category TEXT NOT NULL,
 *   unit TEXT NOT NULL,
 *   weekly_target REAL NOT NULL,
 *   color TEXT,
 *   icon TEXT,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY(week_id) REFERENCES weeks(id) ON DELETE CASCADE
 * );
 * 
 * -- Daily targets and progress table (Monday to Saturday)
 * CREATE TABLE IF NOT EXISTS daily_records (
 *   id TEXT PRIMARY KEY,
 *   goal_id TEXT NOT NULL,
 *   date_str TEXT NOT NULL, -- 'YYYY-MM-DD'
 *   target_value REAL DEFAULT 0,
 *   completed_value REAL DEFAULT 0,
 *   is_completed INTEGER DEFAULT 0,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE,
 *   UNIQUE(goal_id, date_str)
 * );
 */

const STORAGE_KEY_PREFIX = 'goal_tracker_v1_';

export class LocalStorageDB {
  /**
   * Fetch goals for a specific week
   */
  static getWeeklyGoals(weekId: string): GoalItem[] | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}week_${weekId}`);
      if (!data) return null;
      return JSON.parse(data) as GoalItem[];
    } catch (err) {
      console.error('Failed to read weekly goals from storage:', err);
      return null;
    }
  }

  /**
   * Save or replace goals for a specific week
   */
  static saveWeeklyGoals(weekId: string, goals: GoalItem[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}week_${weekId}`, JSON.stringify(goals));
    } catch (err) {
      console.error('Failed to save weekly goals to storage:', err);
    }
  }

  /**
   * Update daily progress for a goal
   */
  static updateDailyProgress(
    weekId: string,
    goalId: string,
    dateString: string,
    completedValue: number
  ): GoalItem[] | null {
    const goals = this.getWeeklyGoals(weekId);
    if (!goals) return null;

    const updated = goals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          completed: {
            ...g.completed,
            [dateString]: Math.max(0, completedValue)
          }
        };
      }
      return g;
    });

    this.saveWeeklyGoals(weekId, updated);
    return updated;
  }

  /**
   * Fetch all goals for all weeks in a month
   */
  static getAllMonthGoals(weekIds: string[]): Record<string, GoalItem[]> {
    const map: Record<string, GoalItem[]> = {};
    for (const wid of weekIds) {
      const goals = this.getWeeklyGoals(wid);
      if (goals) {
        map[wid] = goals;
      }
    }
    return map;
  }

  /**
   * Clear all stored goals
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}
