import { Stack } from "expo-router";
import React from "react";

import { PaperProvider } from "react-native-paper";
import "../global.css";

import { useColorScheme } from "react-native";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  MD3LightTheme as DefaultTheme,
  MD3DarkTheme,
} from "react-native-paper";
const queryClient = new QueryClient();

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1E88E5", // blue 600
    onPrimary: "#FFFFFF",

    secondary: "#64B5F6", // light blue 300
    onSecondary: "#FFFFFF",

    background: "#F4F9FF", // very light blue tint
    surface: "#FFFFFF",
    onSurface: "#0D1B2A", // dark text
    surfaceVariant: "#E3F2FD", // soft blue surface
    outline: "#90CAF9",

    // custom addition for modern contrast
    tertiary: "#42A5F5",
    onTertiary: "#FFFFFF",

    // subtle elevation tones
    elevation: {
      level0: "transparent",
      level1: "#E3F2FD",
      level2: "#BBDEFB",
      level3: "#90CAF9",
      level4: "#64B5F6",
      level5: "#42A5F5",
    },
  },
  roundness: 10,
  version: 3,
  fonts: {
    ...DefaultTheme.fonts,
    bodyLarge: { fontFamily: "System", fontSize: 16 },
    titleMedium: { fontFamily: "System", fontWeight: "600" },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#64B5F6", // lighter blue for dark bg
    onPrimary: "#0D1B2A",

    secondary: "#42A5F5",
    onSecondary: "#0D1B2A",

    background: "#0D1B2A",
    surface: "#1B263B",
    onSurface: "#E3F2FD",
    surfaceVariant: "#2C3E50",
    outline: "#64B5F6",

    tertiary: "#2196F3",
    onTertiary: "#FFFFFF",

    elevation: {
      level0: "transparent",
      level1: "#1E2A38",
      level2: "#253447",
      level3: "#2D3E55",
      level4: "#355872",
      level5: "#3C6FA3",
    },
  },
  roundness: 10,
  version: 3,
  fonts: {
    ...MD3DarkTheme.fonts,
    bodyLarge: { fontFamily: "System", fontSize: 16 },
    titleMedium: { fontFamily: "System", fontWeight: "600" },
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  console.log(colorScheme);
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={lightTheme}>
        <React.Fragment>
          <Stack>
            <Stack.Screen
              name="(protected)"
              options={{ headerShown: false }}
            ></Stack.Screen>
          </Stack>
        </React.Fragment>
      </PaperProvider>
    </QueryClientProvider>
  );
}
