/**
 * healthConnect.ts
 * Reads real health data from Android Health Connect (Mi Band 9 → Zepp Life → Health Connect)
 * and syncs to the Healthy backend.
 */

import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { Platform } from 'react-native';
import { apiPost } from './api';

export type HealthData = {
  date: string;
  steps: number;
  km: number;
  active_minutes: number;
  calories: number;
  resting_hr: number;
  hrv: number;
  sleep_hours: number;
  sleep_score: number;
  respiratory_rate: number;
  stress: number;
  recovery: number;
  strain: number;
  body_battery: number;
};

// Check if Health Connect is available on this device
export async function isHealthConnectAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const status = await getSdkStatus();
    return status === SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

// Request all necessary permissions
export async function requestHealthPermissions(): Promise<boolean> {
  try {
    const granted = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'RestingHeartRate' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
      { accessType: 'read', recordType: 'OxygenSaturation' },
      { accessType: 'read', recordType: 'RespiratoryRate' },
    ]);
    return granted.length > 0;
  } catch {
    return false;
  }
}

// Get start/end of a day
function dayRange(dateStr: string) {
  const start = new Date(dateStr + 'T00:00:00.000Z');
  const end = new Date(dateStr + 'T23:59:59.999Z');
  return { start: start.toISOString(), end: end.toISOString() };
}

// Read today's health data from Health Connect
export async function readTodayHealthData(): Promise<Partial<HealthData> | null> {
  if (Platform.OS !== 'android') return null;

  try {
    await initialize();
    const today = new Date().toISOString().slice(0, 10);
    const { start, end } = dayRange(today);

    const timeRangeFilter = { operator: 'between' as const, startTime: start, endTime: end };

    // Steps
    const stepsResult = await readRecords('Steps', { timeRangeFilter }).catch(() => ({ records: [] }));
    const steps = stepsResult.records.reduce((sum: number, r: any) => sum + (r.count || 0), 0);

    // Distance (km)
    const distResult = await readRecords('Distance', { timeRangeFilter }).catch(() => ({ records: [] }));
    const km = distResult.records.reduce((sum: number, r: any) => sum + (r.distance?.inMeters || 0), 0) / 1000;

    // Calories
    const calResult = await readRecords('TotalCaloriesBurned', { timeRangeFilter }).catch(() => ({ records: [] }));
    const calories = calResult.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories || 0), 0);

    // Resting HR
    const hrResult = await readRecords('RestingHeartRate', { timeRangeFilter }).catch(() => ({ records: [] }));
    const resting_hr = hrResult.records.length > 0
      ? Math.round(hrResult.records.reduce((sum: number, r: any) => sum + (r.beatsPerMinute || 0), 0) / hrResult.records.length)
      : 0;

    // Sleep
    const sleepResult = await readRecords('SleepSession', { timeRangeFilter }).catch(() => ({ records: [] }));
    const sleep_minutes = sleepResult.records.reduce((sum: number, r: any) => {
      const start = new Date(r.startTime).getTime();
      const end = new Date(r.endTime).getTime();
      return sum + (end - start) / 60000;
    }, 0);
    const sleep_hours = Math.round(sleep_minutes / 60 * 10) / 10;
    const sleep_score = Math.min(100, Math.round((sleep_hours / 8) * 100));

    // Respiratory rate
    const rrResult = await readRecords('RespiratoryRate', { timeRangeFilter }).catch(() => ({ records: [] }));
    const respiratory_rate = rrResult.records.length > 0
      ? Math.round(rrResult.records.reduce((sum: number, r: any) => sum + (r.rate || 0), 0) / rrResult.records.length * 10) / 10
      : 0;

    // Derived metrics (simplified from real data)
    const recovery = resting_hr > 0
      ? Math.min(100, Math.max(0, Math.round(100 - (resting_hr - 40) * 1.5)))
      : 0;
    const strain = steps > 0
      ? Math.min(21, Math.round((steps / 10000) * 14 + (calories / 500) * 3))
      : 0;
    const body_battery = Math.min(100, Math.round((sleep_score * 0.6) + (recovery * 0.4)));

    return {
      date: today,
      steps: Math.round(steps),
      km: Math.round(km * 100) / 100,
      active_minutes: Math.round(steps / 100),
      calories: Math.round(calories),
      resting_hr,
      hrv: 0, // HC doesn't expose HRV directly
      sleep_hours,
      sleep_score,
      respiratory_rate,
      stress: 0,
      recovery,
      strain,
      body_battery,
    };
  } catch (e) {
    console.warn('Health Connect read failed:', e);
    return null;
  }
}

// Sync today's data to backend
export async function syncHealthConnectToBackend(): Promise<boolean> {
  try {
    const data = await readTodayHealthData();
    if (!data || data.steps === 0) return false;
    await apiPost('/metrics/sync', data);
    return true;
  } catch (e) {
    console.warn('Health Connect sync failed:', e);
    return false;
  }
}

// Initialize Health Connect and request permissions
export async function setupHealthConnect(): Promise<{ available: boolean; permitted: boolean }> {
  const available = await isHealthConnectAvailable();
  if (!available) return { available: false, permitted: false };
  const permitted = await requestHealthPermissions();
  return { available, permitted };
}
