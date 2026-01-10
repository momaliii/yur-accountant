import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mdz.yuraccountant',
  appName: 'YUR Finance',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f172a',
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
