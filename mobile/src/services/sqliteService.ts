import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoalItem } from '../types/tracker';

const DB_NAME = 'trackorbit.db';
const ASYNC_PREFIX = '@trackorbit_week_';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export class MobileDatabaseService {
  /**
   * Initializes local SQLite database schema
   */
  static async initDB(): Promise<SQLite.SQLiteDatabase> {
    if (dbInstance) return dbInstance;

    try {
      dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
      await dbInstance.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS months (
          month_key TEXT PRIMARY KEY,
          year INTEGER NOT NULL,
          month_index INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS weeks (
          id TEXT PRIMARY KEY,
          month_key TEXT NOT NULL,
          week_number INTEGER NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          sunday_date TEXT
        );

        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          week_id TEXT NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          unit TEXT NOT NULL,
          weekly_target REAL NOT NULL,
          color TEXT,
          icon TEXT
        );

        CREATE TABLE IF NOT EXISTS daily_records (
          id TEXT PRIMARY KEY,
          goal_id TEXT NOT NULL,
          date_str TEXT NOT NULL,
          target_value REAL DEFAULT 0,
          completed_value REAL DEFAULT 0,
          UNIQUE(goal_id, date_str)
        );
      `);
      return dbInstance;
    } catch (e) {
      console.warn('SQLite init warning, falling back to AsyncStorage:', e);
      return dbInstance as any;
    }
  }

  /**
   * Fetch goals for a specific week
   */
  static async getWeeklyGoals(weekId: string): Promise<GoalItem[] | null> {
    try {
      const data = await AsyncStorage.getItem(`${ASYNC_PREFIX}${weekId}`);
      if (!data) return null;
      return JSON.parse(data) as GoalItem[];
    } catch (err) {
      return null;
    }
  }

  /**
   * Save or replace goals for a specific week
   */
  static async saveWeeklyGoals(weekId: string, goals: GoalItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`${ASYNC_PREFIX}${weekId}`, JSON.stringify(goals));

      // Also persist to SQLite in background
      const db = await this.initDB();
      if (db) {
        for (const g of goals) {
          await db.runAsync(
            `INSERT OR REPLACE INTO goals (id, week_id, title, category, unit, weekly_target, color, icon)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [g.id, g.weekId, g.title, g.category, g.unit, g.weeklyTarget, g.color, g.icon]
          );

          for (const [dateStr, targetVal] of Object.entries(g.dailyTargets || {})) {
            const completedVal = g.completed[dateStr] || 0;
            const recordId = `${g.id}_${dateStr}`;
            await db.runAsync(
              `INSERT OR REPLACE INTO daily_records (id, goal_id, date_str, target_value, completed_value)
               VALUES (?, ?, ?, ?, ?)`,
              [recordId, g.id, dateStr, targetVal, completedVal]
            );
          }
        }
      }
    } catch (err) {
      console.warn('Error saving to SQLite:', err);
    }
  }

  /**
   * Update daily progress for a goal
   */
  static async updateDailyProgress(
    weekId: string,
    goalId: string,
    dateString: string,
    completedValue: number
  ): Promise<GoalItem[] | null> {
    const goals = await this.getWeeklyGoals(weekId);
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

    await this.saveWeeklyGoals(weekId, updated);
    return updated;
  }
}
