import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    primaryLight: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
    danger: string;
    success: string;
    inputBackground: string;
  };
};

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#007AFF',
    primaryLight: '#55efc4',
    background: '#FFFFFF',
    card: '#F2F2F2',
    text: '#000000',
    textSecondary: '#636e72',
    border: '#CCCCCC',
    notification: '#FF3B30',
    danger: '#FF3B30',
    success: '#34C759',
    inputBackground: '#f0f0f0',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#0A84FF',
    primaryLight: '#006c57',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#a0a0a0',
    border: '#333333',
    notification: '#FF453A',
    danger: '#FF453A',
    success: '#30d158',
    inputBackground: '#2c2c2c',
  },
};

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(lightTheme);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('userTheme');
        if (savedTheme === 'dark') {
          setTheme(darkTheme);
        } else {
          setTheme(lightTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme.mode === 'light' ? darkTheme : lightTheme;
    setTheme(newTheme);

    try {
      await AsyncStorage.setItem('userTheme', newTheme.mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

export const useTheme = () => useContext(ThemeContext);
