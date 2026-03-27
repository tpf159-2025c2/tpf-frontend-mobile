import { Stack } from "expo-router";

export default function MemberDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="delete" />
    </Stack>
  );
}
