import * as React from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Title,
  Text,
  Appbar,
  List,
  Divider,
  useTheme,
  Avatar,
} from "react-native-paper";

export default function DeviceEventsScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();

  const mockEvents = {
    door: [
      { time: "08:00 AM", event: "Se movió" },
      { time: "10:15 AM", event: "no se movió mas" },
    ],
    window: [{ time: "06:30 AM", event: "se abrio" }],
    gas: [{ time: "01:10 AM", event: "va a explotar" }],
    sound: [
      { time: "07:00 AM", event: "PASDasdalsjd kals jdkals jdklas jdkla sjdk" },
    ],
  };

  const events = mockEvents[id] || [];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* <Appbar.Header> */}
      {/*   <Appbar.BackAction onPress={() => router.back()} /> */}
      {/*   <Appbar.Content title={name} subtitle="Device Events" /> */}
      {/* </Appbar.Header> */}
      <Title>Events</Title>

      <ScrollView
        contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
      >
        {events.length > 0 ? (
          events.map((e, idx) => (
            <React.Fragment key={idx}>
              <List.Item
                title={e.event}
                description={e.time}
                left={() => (
                  <Avatar.Icon
                    size={40}
                    icon="history"
                    color="white"
                    style={{
                      backgroundColor: theme.colors.primary,
                      marginRight: 8,
                    }}
                  />
                )}
              />
              {idx < events.length - 1 && <Divider />}
            </React.Fragment>
          ))
        ) : (
          <Text
            style={{
              marginTop: 24,
              textAlign: "center",
              color: theme.colors.onSurfaceVariant,
            }}
          >
            No recent events for this device.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
