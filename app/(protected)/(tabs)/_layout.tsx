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
        tabBarInactiveTintColor: "#9E9E9E",
      }}
    >
      <Tabs.Screen
        name="houses"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Icon source={focused ? "home" : "home-outline"} size={25} color={color} />
          ),
          title: "Mis Casas",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Icon source={focused ? "cog" : "cog-outline"} size={25} color={color} />
          ),
          title: "Ajustes",
        }}
      />
    </Tabs>
  );
}
