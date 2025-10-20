import { Stack } from "expo-router";
import React from "react";

import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { useColorScheme } from "react-native";

import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();
export default function RootLayout() {
  const colorScheme = useColorScheme();
  console.log(colorScheme);
  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider mode="dark">
        <React.Fragment>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen
                name="(protected)"
                options={{ headerShown: false }}
              ></Stack.Screen>
            </Stack>
          </ThemeProvider>
        </React.Fragment>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
