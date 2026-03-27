import { Stack } from "expo-router";

export default function SensorsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
      <Stack.Screen name="[sensorId]" />
    </Stack>
  );
}
