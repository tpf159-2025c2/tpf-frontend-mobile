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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DeviceEventsScreen() {
  const { id, name } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();

  const mockEvents = {
    door: [
      { time: "10:15 AM", event: "Se cerró" },
      { time: "08:00 AM", event: "Se abrió" },
    ],
    window: [{ time: "06:30 AM", event: "Se abrió" }],
    gas: [{ time: "01:10 AM", event: "Se detectó nivel de gas elevado" }],
    sound: [{ time: "07:00 AM", event: "Ruido" }],
  };

  const events = mockEvents[id] || [];

  return (
    <ScrollView
      style={{
        backgroundColor: theme.colors.background,
      }}
    >
      {/* HEADER */}
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.background,
          elevation: 0,
        }}
      >
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={name} subtitle="Device Events" />
      </Appbar.Header>

      {/* DEVICE SUMMARY CARD */}
      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.elevation.level2,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Avatar.Icon
            icon="information-outline"
            size={48}
            color="white"
            style={{
              backgroundColor: theme.colors.primary,
              marginRight: 16,
            }}
          />

          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontWeight: "600" }}>
              Última actividad
            </Text>

            {events.length > 0 ? (
              <Text style={{ opacity: 0.8, marginTop: 2 }}>
                {events[0].time} — {events[0].event}
              </Text>
            ) : (
              <Text style={{ opacity: 0.6 }}>Sin eventos recientes</Text>
            )}
          </View>
        </View>
      </View>

      {/* TITLE */}
      <Text
        variant="headlineSmall"
        style={{
          marginLeft: 16,
          marginBottom: 8,
          fontWeight: "600",
        }}
      >
        Historial
      </Text>

      {/* EVENTS LIST */}
      <View style={{ paddingHorizontal: 16 }}>
        {events.length > 0 ? (
          events.map((e, idx) => (
            <React.Fragment key={idx}>
              <List.Item
                title={e.event}
                description={e.time}
                left={() => (
                  <Avatar.Icon
                    size={36}
                    icon="clock-outline"
                    color="white"
                    style={{
                      backgroundColor: theme.colors.primary,
                      marginRight: 12,
                      borderRadius: 12,
                    }}
                  />
                )}
                titleNumberOfLines={3}
                descriptionStyle={{
                  marginTop: 2,
                  opacity: 0.7,
                }}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 4,
                  borderRadius: 12,
                  backgroundColor: theme.colors.elevation.level1,
                  marginBottom: 4,
                }}
              />

              {idx < events.length - 1 && (
                <Divider style={{ marginLeft: 60, opacity: 0.4 }} />
              )}
            </React.Fragment>
          ))
        ) : (
          <Text
            style={{
              marginTop: 48,
              textAlign: "center",
              color: theme.colors.onSurfaceVariant,
              fontSize: 16,
              opacity: 0.7,
            }}
          >
            No recent events for this device.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
