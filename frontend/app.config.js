const config = {
  "name": "Healthy",
  "slug": "healthy",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/images/icon.png",
  "scheme": "healthy",
  "userInterfaceStyle": "automatic",
  "newArchEnabled": true,
  "ios": {
    "supportsTablet": false,
    "bundleIdentifier": "com.healthy.app",
    "infoPlist": {
      "NSCameraUsageDescription": "Tira fotos da tua comida para análise IA",
      "NSPhotoLibraryUsageDescription": "Escolhe fotos de comida para análise IA"
    }
  },
  "android": {
    "package": "com.healthy.app",
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/adaptive-icon.png",
      "backgroundColor": "#000000"
    },
    "edgeToEdgeEnabled": true,
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.RECORD_AUDIO",
      "android.permission.BLUETOOTH",
      "android.permission.BLUETOOTH_ADMIN",
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.health.READ_STEPS",
      "android.permission.health.READ_HEART_RATE",
      "android.permission.health.READ_SLEEP",
      "android.permission.health.READ_DISTANCE",
      "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
      "android.permission.health.READ_TOTAL_CALORIES_BURNED",
      "android.permission.health.READ_OXYGEN_SATURATION",
      "android.permission.health.READ_RESPIRATORY_RATE",
      "android.permission.health.READ_RESTING_HEART_RATE"
    ],
    "minSdkVersion": 26
  },
  "web": {
    "bundler": "metro",
    "output": "static",
    "favicon": "./assets/images/favicon.png"
  },
  "plugins": [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "image": "./assets/images/splash-image.png",
        "imageWidth": 200,
        "resizeMode": "contain",
        "backgroundColor": "#000000"
      }
    ],
    [
      "expo-image-picker",
      {
        "photosPermission": "Permite escolher fotos da tua comida para análise IA",
        "cameraPermission": "Permite tirar fotos da tua comida para análise IA"
      }
    ],
    "react-native-health-connect",
    "@react-native-community/datetimepicker",
    "expo-localization"
  ],
  "experiments": {
    "typedRoutes": true
  },
  "extra": {
    "router": {},
    "eas": {
      "projectId": "0a11e814-db80-4173-9490-0e012fcdbbaf"
    }
  },
  "owner": "zepedr07"
};

// Force minSdkVersion for Health Connect
config.android = {
  ...config.android,
  minSdkVersion: 26,
};

export default { expo: config };
