import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mkash.travel',
  appName: 'KTA Travel',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'apitravel.afonestop.com',
      'travel.afonestop.com',
      '*.afonestop.com'
    ]
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    SystemBars: {
      // Edge-to-edge WebView; inject --safe-area-inset-* for tab bars / CTAs.
      insetsHandling: 'css',
      style: 'LIGHT',
      hidden: false
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    }
  }
};

export default config;
