#!/usr/bin/env python3
"""
Adds profile photo support to profile.tsx
Run from healthy-backend root: python patch_profile_photo.py
"""

path = r'frontend\app\(tabs)\profile.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Image and ImagePicker imports
old_import = "import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';"
new_import = "import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Image } from 'react-native';\nimport * as ImagePicker from 'expo-image-picker';"

content = content.replace(old_import, new_import)

# 2. Add AsyncStorage import
old_auth_import = "import { useAuth } from '../../src/auth';"
new_auth_import = "import { useAuth } from '../../src/auth';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"

content = content.replace(old_auth_import, new_auth_import)

# 3. Add useState import
old_react = "import React from 'react';"
new_react = "import React, { useEffect, useState } from 'react';"

content = content.replace(old_react, new_react)

# 4. Add photo state and functions inside component, after const daysLeft line
old_days = "  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;"
new_days = """  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('profile_photo').then(uri => { if (uri) setPhotoUri(uri); });
  }, []);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permite acesso à galeria para escolher uma foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      await AsyncStorage.setItem('profile_photo', uri);
    }
  };

  const removePhoto = () => {
    Alert.alert('Remover foto', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        setPhotoUri(null);
        await AsyncStorage.removeItem('profile_photo');
      }},
    ]);
  };"""

content = content.replace(old_days, new_days)

# 5. Replace avatar view with photo support
old_avatar = """          <View style={styles.avatarBig}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>"""

new_avatar = """          <TouchableOpacity style={styles.avatarBig} onPress={pickPhoto} onLongPress={photoUri ? removePhoto : undefined}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={10} color="#000" />
            </View>
          </TouchableOpacity>"""

content = content.replace(old_avatar, new_avatar)

# 6. Add new styles
old_avatar_style = "  avatarBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: theme.primary },"
new_avatar_style = """  avatarBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.cardElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: theme.primary },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.card },"""

content = content.replace(old_avatar_style, new_avatar_style)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
