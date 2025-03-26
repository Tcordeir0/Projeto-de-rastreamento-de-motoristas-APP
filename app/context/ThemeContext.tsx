import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { supabase } from '@/utils/supabase';

type Theme = {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
  };
};

const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    card: '#F2F2F2',
    text: '#000000',
    border: '#CCCCCC',
    notification: '#FF3B30',
  },
};

const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#0A84FF',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
    notification: '#FF453A',
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
  const [theme, setTheme] = useState<Theme>(Appearance.getColorScheme() === 'dark' ? darkTheme : lightTheme);

  const toggleTheme = async () => {
    const newTheme = theme.mode === 'light' ? darkTheme : lightTheme;
    setTheme(newTheme);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ darkMode: newTheme.mode === 'dark' })
        .eq('id', user.id);
    }
  };

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
    });

    return () => subscription.remove();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

export const useTheme = () => useContext(ThemeContext);
