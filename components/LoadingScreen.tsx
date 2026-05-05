import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import SdhLogo from "./SdhLogo";

export default function LoadingScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SdhLogo size={120} variant="header" />
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.primary }]}>
        SDH
      </Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurface }]}>
        Smart Digital Home
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginTop: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
});
