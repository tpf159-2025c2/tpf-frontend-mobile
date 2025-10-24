import React, { useState } from "react";
import {
  Box,
  HStack,
  Pressable,
  Text,
  Menu,
  MenuItem,
  Icon,
} from "@gluestack-ui/themed";
import { ChevronDownIcon, PlusIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const [selected, setSelected] = useState("Option 1");
  const insets = useSafeAreaInsets();

  return (
    <Box
      className="flex-row items-center justify-between px-4 bg-white shadow-sm"
      style={{ paddingTop: insets.top, paddingBottom: 12 }}
    >
      <HStack space="sm" alignItems="center">
        <Box flexDirection="row" alignItems="center">
          <Text className="text-xl font-semibold text-gray-900">
            {selected}
          </Text>
          <Menu
            placement="bottom left"
            trigger={(triggerProps) => (
              <Pressable
                {...triggerProps}
                className="p-1 flex items-center justify-center"
              >
                <Icon
                  as={ChevronDownIcon}
                  size={20}
                  className="text-gray-700"
                />
              </Pressable>
            )}
          >
            <MenuItem onPress={() => setSelected("Option 1")}>
              Option 1
            </MenuItem>
            <MenuItem onPress={() => setSelected("Option 2")}>
              Option 2
            </MenuItem>
            <MenuItem onPress={() => setSelected("Option 3")}>
              Option 3
            </MenuItem>
          </Menu>
        </Box>
      </HStack>

      <Menu
        placement="bottom right"
        trigger={(triggerProps) => (
          <Pressable {...triggerProps} className="p-1">
            <Icon as={PlusIcon} className="text-gray-700" />
          </Pressable>
        )}
      >
        <MenuItem onPress={() => console.log("Add user")}>Add user</MenuItem>
        <MenuItem onPress={() => console.log("Add item")}>Add item</MenuItem>
        <MenuItem onPress={() => console.log("Add group")}>Add group</MenuItem>
      </Menu>
    </Box>
  );
}
