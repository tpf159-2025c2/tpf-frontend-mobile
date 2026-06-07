import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Button,
  ActivityIndicator,
  useTheme,
  Appbar,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import houseService from "@/services/houseService";
import {
  Sensor,
  SensorReading,
  SensorType,
  SENSOR_TYPE_LABELS,
  SENSOR_TYPE_COLORS,
} from "@/services/types";
import ActionsBottomSheet from "@/components/ActionsBottomSheet";

const SENSOR_IONICONS: Record<string, string> = {
  MOTION: "eye-outline",
  MAGNETIC: "magnet-outline",
  GAS: "flame-outline",
  SOUND: "volume-medium-outline",
};

const READING_VALUE_LABELS: Partial<Record<SensorType, Record<string, string>>> = {
  MAGNETIC: { 1: "Abierta", 0: "Cerrada" },
  GAS: { 1: "Fuga detectada", 0: "Sin fuga" },
  SOUND: { 1: "Sonido detectado", 0: "Silencioso" },
  MOTION: { 1: "Movimiento detectado", 0: "Sin movimiento" },
};

const VALUE_COLORS: Record<string, string> = {
  1: "#e67e22",
  0: "#28a745",
};

function getReadingLabel(sensorType: SensorType, value: string) {
  const normalizedValue = Number(value);
  const labels = READING_VALUE_LABELS[sensorType];

  if (labels && (normalizedValue === 0 || normalizedValue === 1)) {
    return labels[String(normalizedValue)] ?? value;
  }

  return value;
}

function formatShortDuration(ms: number) {
  if (ms < 0) return "0m";

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (totalMinutes > 0) {
    return `${minutes}m`;
  }

  return `${Math.floor(ms / 1000)}s`;
}

export default function SensorDetailsScreen() {
  const router = useRouter();
  const { id, sensorId } = useLocalSearchParams<{
    id: string;
    sensorId: string;
  }>();
  const theme = useTheme();

  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id || !sensorId) return;

    try {
      const [sensorData, metricsData] = await Promise.all([
        houseService.getSensor(id, sensorId),
        houseService.getSensorMetrics(id, sensorId, {}),
      ]);
      setSensor(sensorData);
      setReadings(metricsData.readings || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, sensorId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();

      const intervalId = setInterval(() => {
        fetchData();
      }, 5000);

      return () => clearInterval(intervalId);
    }, [fetchData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const currentStatusInfo = useMemo(() => {
    if (!readings.length || !sensor) return null;

    const latest = [...readings].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];
    const timeDiff = Date.now() - new Date(latest.timestamp).getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);
    let timeStr = `${minutes % 60}m`;
    if (hours > 0) {
      timeStr = `${hours}h ${timeStr}`;
    }

    return {
      label: getReadingLabel(sensor.type, latest.value),
      color: VALUE_COLORS[latest.value] ?? theme.colors.primary,
      timeStr,
    };
  }, [readings, sensor, theme.colors.primary]);

  const todayMetrics = useMemo(() => {
    if (!readings.length || !sensor) {
      return { activeTimeStr: "0m", activationCount: 0 };
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const endOfToday = now.getTime();

    const sorted = [...readings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    let totalMsToday = 0;
    let activationCount = 0;

    for (let i = 0; i < sorted.length; i += 1) {
      const start = new Date(sorted[i].timestamp).getTime();
      const nextTimestamp = sorted[i + 1]
        ? new Date(sorted[i + 1].timestamp).getTime()
        : endOfToday;
      const value = Number(sorted[i].value);

      const boundedStart = Math.max(start, startOfToday);
      const boundedEnd = Math.min(nextTimestamp, endOfToday);

      if (boundedStart < boundedEnd && value === 1) {
        totalMsToday += boundedEnd - boundedStart;
      }

      if (start >= startOfToday && start <= endOfToday && value === 1) {
        activationCount += 1;
      }
    }

    return {
      activeTimeStr: formatShortDuration(totalMsToday),
      activationCount,
    };
  }, [readings, sensor]);

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !sensor) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Error" />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.error }}>{error}</Text>
          <Button onPress={() => fetchData()} style={{ marginTop: 16 }}>
            Reintentar
          </Button>
        </View>
      </View>
    );
  }

  const typeIcon = (SENSOR_IONICONS[sensor.type] as any) ?? "thermometer-outline";

  const sensorBasePath = `/(protected)/(tabs)/houses/${id}/sensors/${sensorId}`;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="" />
        <Appbar.Action icon="dots-vertical" onPress={() => setSheetVisible(true)} />
      </Appbar.Header>

      <ActionsBottomSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        actions={[
          {
            icon: "pulse-outline",
            label: "Ver lecturas",
            onPress: () => router.push(`${sensorBasePath}/readings` as any),
          },
          {
            icon: "settings-outline",
            label: "Configurar Alertas",
            onPress: () => router.push(`${sensorBasePath}/configuration` as any),
          },
          {
            icon: "pencil-outline",
            label: "Editar",
            onPress: () => router.push(`${sensorBasePath}/edit` as any),
          },
          {
            icon: "trash-outline",
            label: "Eliminar",
            destructive: true,
            onPress: () => router.push(`${sensorBasePath}/delete` as any),
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.avatar, { backgroundColor: SENSOR_TYPE_COLORS[sensor.type] ?? theme.colors.primary }]}>
          <Ionicons name={typeIcon} size={48} color="rgba(255,255,255,0.95)" />
        </View>

        <Text variant="titleLarge" style={styles.name}>
          {sensor.name}
        </Text>

        <View style={styles.sensorInfoGrid}>
          <View style={styles.sensorInfoItem}>
            <Ionicons name="barcode-outline" size={16} color="#1D9E75" />
            <View style={styles.sensorInfoText}>
              <Text style={styles.sensorInfoLabel}>Hardware ID</Text>
              <Text style={styles.sensorInfoValue} numberOfLines={1}>
                {sensor.hardwareId}
              </Text>
            </View>
          </View>

          {sensor.location ? (
            <View style={styles.sensorInfoItem}>
              <Ionicons name="location-outline" size={16} color="#1D9E75" />
              <View style={styles.sensorInfoText}>
                <Text style={styles.sensorInfoLabel}>Ubicación</Text>
                <Text style={styles.sensorInfoValue} numberOfLines={1}>
                  {sensor.location}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.sensorInfoItem}>
            <Ionicons name={typeIcon} size={16} color="#1D9E75" />
            <View style={styles.sensorInfoText}>
              <Text style={styles.sensorInfoLabel}>Tipo</Text>
              <Text style={styles.sensorInfoValue} numberOfLines={1}>
                {SENSOR_TYPE_LABELS[sensor.type]}
              </Text>
            </View>
          </View>

          <View style={styles.sensorInfoItem}>
            <Ionicons
              name={sensor.online ? "wifi" : "wifi-outline"}
              size={16}
              color={sensor.online ? "#28a745" : "#adb5bd"}
            />
            <View style={styles.sensorInfoText}>
              <Text style={styles.sensorInfoLabel}>Conexión</Text>
              <Text
                style={[
                  styles.sensorInfoValue,
                  { color: sensor.online ? "#28a745" : "#adb5bd" },
                ]}
                numberOfLines={1}
              >
                {sensor.online ? "En línea" : "Sin conexión"}
              </Text>
            </View>
          </View>

          {sensor.batteryLevel != null ? (
            <View style={styles.sensorInfoItem}>
              <Ionicons
                name={
                  sensor.batteryLevel >= 76
                    ? "battery-full"
                    : sensor.batteryLevel >= 51
                      ? "battery-half"
                      : sensor.batteryLevel >= 26
                        ? "battery-half"
                        : "battery-dead"
                }
                size={16}
                color={
                  sensor.batteryLevel >= 76 || sensor.batteryLevel >= 51
                    ? "#28a745"
                    : sensor.batteryLevel >= 26
                      ? "#ffc107"
                      : "#dc3545"
                }
              />
              <View style={styles.sensorInfoText}>
                <Text style={styles.sensorInfoLabel}>Batería</Text>
                <Text style={styles.sensorInfoValue} numberOfLines={1}>
                  {sensor.batteryLevel}%
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {currentStatusInfo ? (
          <View style={styles.sensorInfoGrid}>
            <View style={styles.sensorInfoItem}>
              <Ionicons name="pulse-outline" size={16} color={currentStatusInfo.color} />
              <View style={styles.sensorInfoText}>
                <Text style={styles.sensorInfoLabel}>Estado actual</Text>
                <Text style={[styles.sensorInfoValue, { color: currentStatusInfo.color }]} numberOfLines={1}>
                  {currentStatusInfo.label}
                </Text>
                <Text style={styles.sensorInfoSub}>hace {currentStatusInfo.timeStr}</Text>
              </View>
            </View>

            <View style={styles.sensorInfoItem}>
              <Ionicons name="time-outline" size={16} color="#1D9E75" />
              <View style={styles.sensorInfoText}>
                <Text style={styles.sensorInfoLabel}>Tiempo activo hoy</Text>
                <Text style={styles.sensorInfoValue} numberOfLines={1}>
                  {todayMetrics.activeTimeStr}
                </Text>
              </View>
            </View>

            <View style={styles.sensorInfoItem}>
              <Ionicons name="flash-outline" size={16} color="#1D9E75" />
              <View style={styles.sensorInfoText}>
                <Text style={styles.sensorInfoLabel}>Activaciones hoy</Text>
                <Text style={styles.sensorInfoValue} numberOfLines={1}>
                  {todayMetrics.activationCount} {todayMetrics.activationCount === 1 ? "vez" : "veces"}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  sensorInfoGrid: {
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  sensorInfoItem: {
    width: "48%",
    flexGrow: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  sensorInfoText: {
    flex: 1,
    gap: 3,
  },
  sensorInfoLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sensorInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  sensorInfoSub: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
});
