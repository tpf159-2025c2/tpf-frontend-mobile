import { Stack } from "expo-router";

export default function MembersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
      <Stack.Screen name="[memberId]" />
    </Stack>
  );
}
