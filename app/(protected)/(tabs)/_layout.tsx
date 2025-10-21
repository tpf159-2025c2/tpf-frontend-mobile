import { Tabs } from "expo-router";
import { Icon, EditIcon } from "@/components/ui/icon";

import {
  Home,
  AddIcon,
  GlobeIcon,
  PlayIcon,
  SettingsIcon,
} from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import { MenuItemLabel, Menu, MenuItem } from "@/components/ui/menu";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // 🔹 Remove elevation and shadow
        headerStyle: {
          backgroundColor: "transparent",
          elevation: 0, // Android
          shadowOpacity: 0, // iOS
        },
        headerTitle: "", // hide text title
        headerTransparent: true, // makes header background see-through
        headerRightContainerStyle: {
          paddingRight: 16, // a bit of spacing on the right
        },
        // 🔹 Optional: make tabBar blend too
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 0,
        },
        headerRight: () => (
          <Menu
            placement="bottom"
            offset={5}
            disabledKeys={["Settings"]}
            trigger={({ ...triggerProps }) => {
              return (
                <Button {...triggerProps}>
                  <ButtonIcon>
                    <Icon as={AddIcon}></Icon>
                  </ButtonIcon>
                </Button>
              );
            }}
          >
            <MenuItem key="Add account" textValue="Add account">
              <Icon as={AddIcon} size="sm" className="mr-2" />
              <MenuItemLabel size="sm">Add account</MenuItemLabel>
            </MenuItem>
            <MenuItem key="Community" textValue="Community">
              <Icon as={GlobeIcon} size="sm" className="mr-2" />
              <MenuItemLabel size="sm">Community</MenuItemLabel>
            </MenuItem>
            <MenuItem key="Plugins" textValue="Plugins">
              <Icon as={PlayIcon} size="sm" className="mr-2" />
              <MenuItemLabel size="sm">Plugins</MenuItemLabel>
            </MenuItem>
            <MenuItem key="Settings" textValue="Settings">
              <Icon as={SettingsIcon} size="sm" className="mr-2" />
              <MenuItemLabel size="sm">Settings</MenuItemLabel>
            </MenuItem>
          </Menu>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({}) => (
            <Icon as={Home} className="text-typography-400 "></Icon>
          ),
          title: "Asdasdasd",
        }}
      />
      <Tabs.Screen name="welcome" />
    </Tabs>
  );
}
