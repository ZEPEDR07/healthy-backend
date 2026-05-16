/**
 * useHealthSync.ts
 * Hook that automatically syncs Health Connect data when the app opens.
 * Shows a sync status indicator and handles permissions.
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
  isHealthConnectAvailable,
  requestHealthPermissions,
  syncHealthConnectToBackend,
} from './healthConnect';
import { initialize } from 'react-native-health-connect';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'unavailable' | 'error';

export function useHealthSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [hasRealData, setHasRealData] = useState(false);

  const sync = useCallback(async (silent = true) => {
    if (Platform.OS !== 'android') {
      setSyncStatus('unavailable');
      return;
    }

    try {
      const available = await isHealthConnectAvailable();
      if (!available) {
        setSyncStatus('unavailable');
        return;
      }

      await initialize();
      setSyncStatus('syncing');

      const permitted = await requestHealthPermissions();
      if (!permitted) {
        setSyncStatus('unavailable');
        if (!silent) {
          Alert.alert(
            'Permissões necessárias',
            'Para sincronizar dados reais, permite o acesso ao Health Connect nas definições.',
          );
        }
        return;
      }

      const success = await syncHealthConnectToBackend();
      if (success) {
        setSyncStatus('synced');
        setLastSynced(new Date());
        setHasRealData(true);
      } else {
        setSyncStatus('idle');
      }
    } catch (e) {
      setSyncStatus('error');
      console.warn('Health sync error:', e);
    }
  }, []);

  // Auto-sync on mount
  useEffect(() => {
    sync(true);
  }, [sync]);

  return { syncStatus, lastSynced, hasRealData, sync };
}
