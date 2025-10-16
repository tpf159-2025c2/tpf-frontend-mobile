import { Stack } from "expo-router";
import React from "react";

import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { useColorScheme } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  console.log(colorScheme)
  return (
    <React.Fragment>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="(protected)"
            options={{ headerShown: false }}
          ></Stack.Screen>
        </Stack>
      </ThemeProvider>
    </React.Fragment>
  );
}
