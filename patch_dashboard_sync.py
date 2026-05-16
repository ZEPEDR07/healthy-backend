#!/usr/bin/env python3
"""
Adds Health Connect sync to the dashboard (index.tsx)
Run from healthy-backend root: python patch_dashboard_sync.py
"""

import re

path = r'frontend\app\(tabs)\index.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import for useHealthSync
old_import = "import { t, formatLongDate, formatDistance, distanceUnit } from '../../src/i18n';"
new_import = """import { t, formatLongDate, formatDistance, distanceUnit } from '../../src/i18n';
import { useHealthSync } from '../../src/useHealthSync';"""

content = content.replace(old_import, new_import)

# 2. Add hook call inside Dashboard component, after const [dateOpen, setDateOpen] = useState(false);
old_state = "  const [dateOpen, setDateOpen] = useState(false);"
new_state = """  const [dateOpen, setDateOpen] = useState(false);
  const { syncStatus, sync: syncHealth } = useHealthSync();"""

content = content.replace(old_state, new_state)

# 3. Add sync call inside onRefresh
old_refresh = "  const onRefresh = () => { setRefreshing(true); load(selectedDate); };"
new_refresh = """  const onRefresh = () => { setRefreshing(true); syncHealth(true); load(selectedDate); };"""

content = content.replace(old_refresh, new_refresh)

# 4. Update sync pill to show real status
old_pill = """          <View style={styles.syncPill} testID="sync-pill">
            <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
            <Text style={styles.syncText}>{t('home.synced')}</Text>
          </View>"""

new_pill = """          <View style={styles.syncPill} testID="sync-pill">
            <Ionicons
              name={syncStatus === 'syncing' ? 'sync' : syncStatus === 'synced' ? 'checkmark-circle' : 'cloud-offline-outline'}
              size={14}
              color={syncStatus === 'error' ? theme.stressRed : theme.primary}
            />
            <Text style={styles.syncText}>
              {syncStatus === 'syncing' ? 'A sincronizar...' : syncStatus === 'synced' ? 'Health Connect' : t('home.synced')}
            </Text>
          </View>"""

content = content.replace(old_pill, new_pill)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ Dashboard Health Connect sync added')
