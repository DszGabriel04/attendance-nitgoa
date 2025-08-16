/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#4FC3F7';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional colors for forms and UI
    cardBackground: '#ffffff',
    inputBackground: '#f9fafb',
    inputBorder: '#e5e7eb',
    buttonPrimary: '#0a7ea4',
    buttonSecondary: '#6b7280',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
  dark: {
    text: '#ECEDEE',
    background: '#1a1a1a', // Dark grey background
    tint: tintColorDark,
    icon: '#B0BEC5',
    tabIconDefault: '#78909C',
    tabIconSelected: tintColorDark,
    // Additional colors for forms and UI in dark mode
    cardBackground: '#2d2d2d', // Medium grey for cards
    inputBackground: '#404040', // Darker grey for inputs
    inputBorder: '#555555',
    buttonPrimary: '#4FC3F7',
    buttonSecondary: '#78909C',
    success: '#4CAF50',
    danger: '#F44336',
    warning: '#FF9800',
  },
};
