import { Icon, Menu, Button, IconButton } from "react-native-paper";
import { Tabs } from "expo-router";
import { useState } from "react";

import {
  Home,
  GlobeIcon,
  ArrowDownToDotIcon,
  PlayIcon,
  SettingsIcon,
} from "lucide-react-native";

import { useTheme } from "@react-navigation/native";
export default function TabLayout() {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);

  const closeMenu = () => setVisible(false);
  return (
    <Tabs
      screenOptions={{
        // headerBackgroundContainerStyle: {
        //   opacity: 5,
        // },
        headerRight: () => (
          <Menu
            visible={visible}
            onDismiss={closeMenu}
            anchor={<IconButton onPress={openMenu} icon={"plus"}></IconButton>}
          >
            <Menu.Item title="Agregar dispositivo"></Menu.Item>
          </Menu>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({}) => <Icon source={"home"} size={25}></Icon>,
          title: "Asdasdasd",
        }}
      />
      <Tabs.Screen
        name="welcome"
        options={{
          tabBarIcon: ({}) => <Icon source={"camera"} size={25}></Icon>,
          title: "welcome"
        }}
      />
    </Tabs>
  );
}
