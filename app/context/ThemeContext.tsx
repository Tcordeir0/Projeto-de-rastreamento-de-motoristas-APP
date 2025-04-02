"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Defina as cores para temas claro e escuro
const lightTheme = {
  dark: false,
  colors: {
    primary: "#007AFF",
    background: "#F2F2F7",
    card: "#FFFFFF",
    text: "#000000",
    border: "#C7C7CC",
    notification: "#FF3B30",
    // Adicione outras cores específicas do seu app
    cardBackground: "#FFFFFF",
    buttonBackground: "#007AFF",
    buttonText: "#FFFFFF",
    inputBackground: "#F2F2F7",
    placeholderText: "#8E8E93",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
  },
}

const darkTheme = {
  dark: true,
  colors: {
    primary: "#0A84FF",
    background: "#1C1C1E",
    card: "#2C2C2E",
    text: "#FFFFFF",
    border: "#38383A",
    notification: "#FF453A",
    // Adicione outras cores específicas do seu app
    cardBackground: "#2C2C2E",
    buttonBackground: "#0A84FF",
    buttonText: "#FFFFFF",
    inputBackground: "#38383A",
    placeholderText: "#8E8E93",
    success: "#30D158",
    warning: "#FF9F0A",
    danger: "#FF453A",
  },
}

// Defina o tipo para o tema
type Theme = {
  dark: boolean
  colors: {
    primary: string
    background: string
    card: string
    text: string
    border: string
    notification: string
    cardBackground: string
    buttonBackground: string
    buttonText: string
    inputBackground: string
    placeholderText: string
    success: string
    warning: string
    danger: string
    [key: string]: string
  }
}

// Defina o tipo para o contexto
type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
  isDarkMode: boolean
}

const THEME_STORAGE_KEY = "app_theme_preference"

// Crie o contexto com o tipo apropriado
const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  toggleTheme: () => {},
  isDarkMode: false,
})

// Defina o tipo para as props do ThemeProvider
interface ThemeProviderProps {
  children: ReactNode
}

// Provedor do contexto com tipagem correta
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(lightTheme)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Carrega a preferência de tema salva ao iniciar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (savedTheme === "dark") {
          setTheme(darkTheme)
          setIsDarkMode(true)
        }
      } catch (error) {
        console.error("Erro ao carregar tema:", error)
      }
    }

    loadTheme()
  }, [])

  // Função para alternar entre temas
  const toggleTheme = async () => {
    const newTheme = theme.dark ? lightTheme : darkTheme
    const newIsDarkMode = !isDarkMode

    setTheme(newTheme)
    setIsDarkMode(newIsDarkMode)

    // Salva a preferência do usuário
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme.dark ? "dark" : "light")
    } catch (error) {
      console.error("Erro ao salvar tema:", error)
    }
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, isDarkMode }}>{children}</ThemeContext.Provider>
}

// Hook personalizado para usar o tema
export const useTheme = () => useContext(ThemeContext)
export default ThemeProvider;
