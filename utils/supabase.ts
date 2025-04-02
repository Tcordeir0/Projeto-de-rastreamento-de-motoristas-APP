import { createClient } from "@supabase/supabase-js"
import "react-native-url-polyfill/auto"
import * as SecureStore from "expo-secure-store"

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://dwszpyfiphkfcvrjaqvt.supabase.co",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3c3pweWZpcGhrZmN2cmphcXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDIzNzIsImV4cCI6MjA1ODIxODM3Mn0.QNb8JhI9pExtmYwnAfsYAnxZXtBFp1Inp8srfUW9NNE",
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
)

