import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import useWelcomeStatus from "@/hooks/useStore";

export default function WelcomeScreen() {
  const router = useRouter();
  const setEntered = useWelcomeStatus((state) => state.setEntered);

  const handleContinue = () => {
    console.log("Setting entered");
    setEntered(true);
    router.replace("/(protected)/(tabs)/home");
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Welcome to the App 🎉
      </Text>
      <Button title="Continue" onPress={handleContinue} />
    </View>
  );
}
