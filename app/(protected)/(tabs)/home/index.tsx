import { Button } from "react-native-paper";
import useWelcomeStatus from "@/hooks/useStore";
import { ScrollView, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Home, GlobeIcon, PlayIcon, SettingsIcon } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlatList } from "react-native";
import { useRouter } from "expo-router";
import * as React from "react";
import { View } from "react-native";
import {
  Text,
  Card,
  Avatar,
  Title,
  Paragraph,
  useTheme,
} from "react-native-paper";

let mockTodos = [
  { id: 1, title: "Learn React Query" },
  { id: 2, title: "Build a cool RN app" },
];

function getMockTodos() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTodos), 500);
  });
}

function addMockTodo(todo) {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockTodos.push(todo);
      resolve(todo);
    }, 300);
  });
}

function Todos() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ["todos"], queryFn: getMockTodos });

  const mutation = useMutation({
    mutationFn: addMockTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  if (query.isLoading) return <Text>Loading...</Text>;
  if (query.isError) return <Text>Error loading todos</Text>;

  return (
    <View style={{ gap: 10, marginTop: 10 }}>
      <FlatList
        data={query.data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <Text>• {item.title}</Text>}
      />
      <Button
        disabled={mutation.isPending}
        onPress={() =>
          mutation.mutate({
            id: Date.now(),
            title: "Do Laundry",
          })
        }
      >
        {mutation.isPending ? "Adding..." : "Da sdjas dajisd a"}
      </Button>
    </View>
  );
}
export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();

  const setEntered = useWelcomeStatus((state) => state.setEntered);
  const devices = [
    {
      id: "gas",
      name: "Detector de Gas",
      status: "On",
      icon: "gas-burner",
    },
    {
      id: "door",
      name: "Puerta",
      status: "22°C",
      icon: "door",
    },
    {
      id: "window",
      name: "Ventana",
      status: "Active",
      icon: "window-closed-variant",
    },
    {
      id: "sound",
      name: "Sensor de Sonido",
      status: "Listening",
      icon: "speaker",
    },
  ];
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: insets.top + 8,
      }}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 32,
      }}
    >
      <View style={{ marginBottom: 20 }}>
        <Title style={{ fontSize: 26, fontWeight: "700" }}>hola</Title>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {devices.map((device, index) => (
          <Card
            key={index}
            style={{
              width: "48%",
              marginBottom: 16,
              borderRadius: 16,
              overflow: "hidden",
              elevation: 3,
            }}
            onPress={() =>
              router.push({
                pathname: "/(protected)/(tabs)/home/device",
                params: { id: device.id, name: device.name },
              })
            }
          >
            <Card.Content
              style={{
                alignItems: "center",
                paddingVertical: 16,
              }}
            >
              <Avatar.Icon
                size={48}
                icon={device.icon}
                color="white"
                style={{
                  marginBottom: 8,
                }}
              />
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "600",
                  textAlign: "center",
                  marginBottom: 4,
                }}
              >
                {device.name}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {device.status}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
