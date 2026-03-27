import { Stack } from "expo-router";
import React, { useEffect } from "react";

import { PaperProvider } from "react-native-paper";
import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MD3LightTheme as DefaultTheme } from "react-native-paper";
import useAuthStore from "@/hooks/useAuthStore";

const queryClient = new QueryClient();

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#1E88E5",
    onPrimary: "#FFFFFF",

    secondary: "#64B5F6",
    onSecondary: "#FFFFFF",

    background: "#FFFFFF",
    surface: "#FFFFFF",
    onSurface: "#1C1B1F",
    surfaceVariant: "#F5F5F5",
    outline: "#E0E0E0",

    tertiary: "#42A5F5",
    onTertiary: "#FFFFFF",

    elevation: {
      level0: "transparent",
      level1: "#FFFFFF",
      level2: "#F5F5F5",
      level3: "#EEEEEE",
      level4: "#E0E0E0",
      level5: "#BDBDBD",
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

export default function RootLayout() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    checkAuth().finally(() => setLoading(false));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={lightTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(protected)" />
        </Stack>
      </PaperProvider>
    </QueryClientProvider>
  );
}
