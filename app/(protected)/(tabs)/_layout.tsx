import { Tabs } from "expo-router";
import { Icon, EditIcon } from "@/components/ui/icon";

import {
  Camera,
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({}) => (
            <Icon as={Camera} className="text-typography-400 "></Icon>
          ),
        }}
      />
      <Tabs.Screen name="welcome" />
    </Tabs>
  );
}
