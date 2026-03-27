import { Stack } from "expo-router";

export default function HouseDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="delete" />
      <Stack.Screen name="sensors" />
      <Stack.Screen name="members" />
    </Stack>
  );
}
