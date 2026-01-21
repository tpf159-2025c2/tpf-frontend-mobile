import { List } from "react-native-paper";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as React from "react";
import { View } from "react-native";
import {
        Text,
        Card,
        Avatar,
        Title,
        useTheme,
} from "react-native-paper";
export default function WelcomeScreen() {
        const insets = useSafeAreaInsets();
        const router = useRouter();
        const theme = useTheme();

        const devices = [
                {
                        id: "gas",
                        name: "Sensor Gas Cocina",
                        status: "On",
                        icon: "gas-burner",
                },
                {
                        id: "door",
                        name: "Sensor Puerta Garage",
                        status: "Abierta",
                        icon: "door",
                },
                {
                        id: "window",
                        name: "Ventana",
                        status: "Cerrada",
                        icon: "window-closed-variant",
                },
                {
                        id: "sound",
                        name: "Sensor de Sonido",
                        status: "Escuchando",
                        icon: "speaker",
                },
        ];
        const mockEvents = {
                "Puerta": [
                        { time: "08:00 AM", event: "Se abrió" },
                        { time: "10:15 AM", event: "Se cerró" },
                ],
                "Ventana": [{ time: "06:30 AM", event: "Se abrió" }],
                "Detector de Gas": [{ time: "01:10 AM", event: "Se detectó nivel de gas elevado" }],
                "Sensor de Sonido": [
                        { time: "07:00 AM", event: "Ruido" },
                ],
        };
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
                                <Title style={{ fontSize: 26, fontWeight: "700" }}>Dispositivos</Title>
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
                        <View style={{ marginBottom: 20 }}>
                                <Title style={{ fontSize: 26, fontWeight: "700" }}>Eventos</Title>
                        </View>

                        <View style={{ padding: 12 }}>
                                {Object.entries(mockEvents).map(([category, events]) => (
                                        <View key={category} style={{ marginBottom: 12 }}>

                                                {/* Category title */}
                                                <Text
                                                        variant="titleSmall"
                                                        style={{ marginBottom: 6, textTransform: "capitalize" }}
                                                >
                                                        {category}
                                                </Text>

                                                {events.map((e, index) => (
                                                        <List.Item
                                                                key={index}
                                                                title={e.event}
                                                                description={e.time}
                                                                style={{
                                                                        paddingVertical: 4,      // tighter vertical padding
                                                                        minHeight: 0,            // disable the big default min height
                                                                        backgroundColor: theme.colors.surface,
                                                                        borderRadius: 8,
                                                                        marginBottom: 4,         // less gap between items
                                                                }}
                                                        />
                                                ))}
                                        </View>
                                ))}
                        </View>
                </ScrollView>
        );
}
