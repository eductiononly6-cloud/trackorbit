import { WidgetPayload } from '../types/tracker';

const WIDGET_DATA_KEY = 'home_screen_widget_payload';

/**
 * Service to sync data with native iOS / Android widgets
 */
export class WidgetSyncBridge {
  /**
   * Save payload to local storage and trigger native widget refresh bridge
   */
  static syncWidgetData(payload: WidgetPayload): void {
    try {
      const jsonString = JSON.stringify(payload);
      localStorage.setItem(WIDGET_DATA_KEY, jsonString);

      // React Native / Expo Native Module Bridge hook
      // If running inside React Native with react-native-home-widget:
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'SYNC_WIDGET', data: payload })
        );
      }

      // If running with a direct global native bridge:
      if (typeof window !== 'undefined' && (window as any).NativeWidgetBridge) {
        (window as any).NativeWidgetBridge.updateWidgetData(jsonString);
      }
    } catch (e) {
      console.warn('Widget sync warning:', e);
    }
  }

  /**
   * Get the current active widget payload
   */
  static getLatestWidgetPayload(): WidgetPayload | null {
    try {
      const data = localStorage.getItem(WIDGET_DATA_KEY);
      if (!data) return null;
      return JSON.parse(data) as WidgetPayload;
    } catch (e) {
      return null;
    }
  }
}
