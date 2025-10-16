
import { View,  Button } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";

import useWelcomeStatus from "@/hooks/useStore";
export default function WelcomeScreen() {
  const router = useRouter();

  const setEntered = useWelcomeStatus((state) => state.setEntered);

  return (
    <View className="flex-1  items-center justify-center bg-white">
      <Text underline={true} className="text-xl font-bold text-blue-500">
      Otra cosa
      </Text>
    </View>
  );
}
