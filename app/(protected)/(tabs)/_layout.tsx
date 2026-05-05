import { Icon, useTheme } from "react-native-paper";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E0E0E0",
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "#757575",
      }}
    >
      <Tabs.Screen
        name="houses"
        options={{
          tabBarIcon: () => (
            <Icon source="home" size={25} color={theme.colors.onSecondary} />
          ),
          title: "Mis Casas",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: () => (
            <Icon source="cog" size={25} color={theme.colors.onSecondary} />
          ),
          title: "Ajustes",
        }}
      />
    </Tabs>
  );
}
