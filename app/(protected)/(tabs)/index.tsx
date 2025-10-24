import { Button } from "react-native-paper";
import useWelcomeStatus from "@/hooks/useStore";

import { Home, GlobeIcon, PlayIcon, SettingsIcon } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, FlatList, Text } from "react-native";
import { useRouter } from "expo-router";

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

  const setEntered = useWelcomeStatus((state) => state.setEntered);

  return (
    <View>
      <Text>Welcome to Nativewind!</Text>

      <Todos />
    </View>
  );
}
