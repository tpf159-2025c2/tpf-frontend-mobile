import { Icon } from "react-native-paper";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E0E0E0",
        },
        tabBarActiveTintColor: "#1E88E5",
        tabBarInactiveTintColor: "#757575",
      }}
    >
      <Tabs.Screen
        name="houses"
        options={{
          tabBarIcon: ({ color }) => <Icon source="home" size={25} color={color} />,
          title: "Mis Casas",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color }) => <Icon source="cog" size={25} color={color} />,
          title: "Ajustes",
        }}
      />
    </Tabs>
  );
}
