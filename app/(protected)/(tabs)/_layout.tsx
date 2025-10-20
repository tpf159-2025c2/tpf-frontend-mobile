import { Tabs } from "expo-router";
import { Icon, EditIcon } from "@/components/ui/icon";

import { Home } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";

export default function TabLayout() {
  return (
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({}) => (
              <Icon as={Home} className="text-typography-400 "></Icon>
            ),
          }}
        />
        <Tabs.Screen name="welcome" />
      </Tabs>
  );
}
