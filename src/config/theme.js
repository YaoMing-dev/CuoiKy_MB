import { MD3LightTheme } from 'react-native-paper';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4A90D9',
    primaryContainer: '#D4E4F7',
    secondary: '#FF6B6B',
    secondaryContainer: '#FFE0E0',
    tertiary: '#4CAF50',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F0F0',
    error: '#E53935',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A1A',
    onSurface: '#1A1A1A',
    outline: '#E0E0E0',
  },
  roundness: 12,
};

export default theme;
