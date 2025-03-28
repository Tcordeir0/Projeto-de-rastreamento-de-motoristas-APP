import { Stack } from "expo-router"
import MapScreen from "./app/(app)/index"

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
    </Stack>
  )
}