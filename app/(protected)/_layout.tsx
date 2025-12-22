import { Redirect, Stack } from "expo-router";
import React from "react";
import useWelcomeStatus from "@/hooks/useStore";

export default function RootLayout() {
  const loggedIn = useWelcomeStatus((state) => state.entered);
  if (!loggedIn) {
    return <Redirect href={"/login"} />;
  }
  return (
    <React.Fragment>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        ></Stack.Screen>
      </Stack>
    </React.Fragment>
  );
}
