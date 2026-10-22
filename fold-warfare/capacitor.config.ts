import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.krishanthasandaruwan.foldwarfare',
  appName: 'Fold Warfare',
  webDir: 'dist',
  backgroundColor: '#05080c',
  ios: {
    contentInset: 'never',
    scrollEnabled: false,
    backgroundColor: '#05080c',
  },
  plugins: {
    StatusBar: { overlaysWebView: true, style: 'DARK' },
  },
};

export default config;
