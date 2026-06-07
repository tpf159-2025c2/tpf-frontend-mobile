import { Stack } from "expo-router";

export default function SensorDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="readings" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="delete" />
      <Stack.Screen name="pairing" />
    </Stack>
  );
}
