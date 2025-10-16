import { Redirect, Stack } from "expo-router";
import React from "react";
import useWelcomeStatus from "@/hooks/useStore";

const LoggedIn = false;

export default function RootLayout() {
  const loffedIn = useWelcomeStatus((state) => state.entered);
  if (!loffedIn) {
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
