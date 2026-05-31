import { useState, useEffect, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Button,
  ActivityIndicator,
  useTheme,
  Appbar,
  Chip,
  List,
  Card,
  Modal,
  Portal,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import houseService from "@/services/houseService";
import {
  Sensor,
  SensorReading,
  SensorType,
  SENSOR_TYPE_LABELS,
  SENSOR_TYPE_COLORS,
  SENSOR_STATUS_LABELS,
  SENSOR_STATUS_COLORS,
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

function formatDuration(ms: number) {
  if (ms < 0) return "0s";

  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const totalMinutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (totalMinutes < 60) return `${totalMinutes}m ${seconds}s`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

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
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);

  type Preset = "today" | "week" | "month" | "custom";
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const getReadingParams = useCallback(() => {
    const params: { from?: string; to?: string } = {};

    if (activePreset === "today") {
      const now = new Date();
      params.from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      params.to = now.toISOString();
      return params;
    }

    if (activePreset === "week") {
      const now = new Date();
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      params.from = from.toISOString();
      params.to = now.toISOString();
      return params;
    }

    if (activePreset === "month") {
      const now = new Date();
      const from = new Date(now);
      from.setMonth(now.getMonth() - 1);
      params.from = from.toISOString();
      params.to = now.toISOString();
      return params;
    }

    if (activePreset === "custom") {
      if (fromDate) params.from = fromDate.toISOString();
      if (toDate) params.to = toDate.toISOString();
      return params;
    }

    return params;
  }, [activePreset, fromDate, toDate]);

  const fetchData = useCallback(async (readingParams?: { from?: string; to?: string }) => {
    if (!id || !sensorId) return;

    try {
      const params = readingParams ?? getReadingParams();
      const [sensorData, metricsData] = await Promise.all([
        houseService.getSensor(id, sensorId),
        houseService.getSensorMetrics(id, sensorId, params),
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
  }, [id, sensorId, getReadingParams]);

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

  const handlePreset = (preset: "today" | "week" | "month") => {
    const now = new Date();
    let from: Date;
    if (preset === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (preset === "week") {
      from = new Date(now);
      from.setDate(now.getDate() - 7);
    } else {
      from = new Date(now);
      from.setMonth(now.getMonth() - 1);
    }
    setActivePreset(preset);
    setFromDate(from);
    setToDate(now);
    setReadingsLoading(true);
    fetchData({ from: from.toISOString(), to: now.toISOString() }).finally(() => {
      setReadingsLoading(false);
    });
  };

  const handleApplyCustom = () => {
    setActivePreset("custom");
    setCustomModalVisible(false);
    setReadingsLoading(true);
    fetchData({
      ...(fromDate ? { from: fromDate.toISOString() } : {}),
      ...(toDate ? { to: toDate.toISOString() } : {}),
    }).finally(() => {
      setReadingsLoading(false);
    });
  };

  const handleClear = () => {
    setActivePreset(null);
    setFromDate(null);
    setToDate(null);
    setReadingsLoading(true);
    fetchData({}).finally(() => {
      setReadingsLoading(false);
    });
  };

  const readingsWithMeta = useMemo(() => {
    if (!sensor) return [];

    const sorted = [...readings].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return sorted.map((reading, index) => {
      const currentTimestamp = new Date(reading.timestamp).getTime();
      const previousTimestamp =
        index === 0
          ? Date.now()
          : new Date(sorted[index - 1].timestamp).getTime();

      return {
        ...reading,
        label: getReadingLabel(sensor.type, reading.value),
        valueColor: VALUE_COLORS[reading.value] ?? "#475569",
        timestampLabel: new Date(reading.timestamp).toLocaleString(),
        durationLabel: formatDuration(Math.max(0, previousTimestamp - currentTimestamp)),
      };
    });
  }, [readings, sensor]);

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

  const statusColor = SENSOR_STATUS_COLORS[sensor.status] ?? "#6c757d";
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
            icon: "settings-outline",
            label: "Configurar",
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
        {sensor.location ? (
          <Text variant="bodyMedium" style={styles.location}>
            {sensor.location}
          </Text>
        ) : null}

        <View style={styles.chipsRow}>
          <Chip compact style={styles.typeChip} textStyle={styles.typeChipText}>
            {SENSOR_TYPE_LABELS[sensor.type]}
          </Chip>
        </View>

        <Button
          mode="outlined"
          icon="bell-outline"
          onPress={() => router.push(`${sensorBasePath}/configuration` as any)}
          style={styles.configButton}
          contentStyle={styles.configButtonContent}
          labelStyle={styles.configButtonLabel}
        >
          Configurar alertas
        </Button>

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
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { borderLeftColor: currentStatusInfo.color }]}>
              <Text style={styles.metricLabel}>Estado actual</Text>
              <Text style={[styles.metricValue, { color: currentStatusInfo.color }]} numberOfLines={1}>
                {currentStatusInfo.label}
              </Text>
              <Text style={styles.metricSubvalue}>hace {currentStatusInfo.timeStr}</Text>
            </View>

            <View style={[styles.metricCard, styles.metricCardRow, { borderLeftColor: '#88b4ff' }]}>
              <Ionicons name="time-outline" size={24} color="#88b4ff" style={styles.metricIconSide} />
              <View style={styles.metricTextBlock}>
                <Text style={styles.metricLabel}>Tiempo activo hoy</Text>
                <Text style={styles.metricValue}>{todayMetrics.activeTimeStr}</Text>
              </View>
            </View>

            <View style={[styles.metricCard, styles.metricCardRow, { borderLeftColor: '#ffd24cbb' }]}>
              <Ionicons name="flash-outline" size={24} color="#ffd24cbb" style={styles.metricIconSide} />
              <View style={styles.metricTextBlock}>
                <Text style={styles.metricLabel}>Activaciones hoy</Text>
                <Text style={styles.metricValue}>
                  {todayMetrics.activationCount} {todayMetrics.activationCount === 1 ? "vez" : "veces"}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {sensor.status === "PENDING" && (
          <Button
            mode="contained"
            icon="link"
            onPress={() =>
              router.push(
                `/(protected)/(tabs)/houses/${id}/sensors/${sensorId}/pairing`,
              )
            }
            style={styles.pairingButton}
          >
            Aceptar Emparejamiento
          </Button>
        )}

        <View style={styles.readingsSection}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Lecturas
            </Text>
            {activePreset !== null && (
              <Chip
                icon="close"
                onPress={handleClear}
                disabled={readingsLoading}
                compact
              >
                Limpiar
              </Chip>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}
          >
            <Chip
              selected={activePreset === "today"}
              onPress={() => handlePreset("today")}
              disabled={readingsLoading}
              style={styles.presetChip}
            >
              Hoy
            </Chip>
            <Chip
              selected={activePreset === "week"}
              onPress={() => handlePreset("week")}
              disabled={readingsLoading}
              style={styles.presetChip}
            >
              Semana
            </Chip>
            <Chip
              selected={activePreset === "month"}
              onPress={() => handlePreset("month")}
              disabled={readingsLoading}
              style={styles.presetChip}
            >
              Mes
            </Chip>
            <Chip
              icon="calendar"
              selected={activePreset === "custom"}
              onPress={() => setCustomModalVisible(true)}
              disabled={readingsLoading}
              style={styles.presetChip}
            >
              Personalizado
            </Chip>
          </ScrollView>

          {readingsLoading ? (
            <ActivityIndicator style={styles.readingsLoader} color={theme.colors.primary} />
          ) : readingsWithMeta.length === 0 ? (
            <Text style={styles.emptyText}>Sin lecturas disponibles</Text>
          ) : (
            <View style={styles.readingsList}>
              {readingsWithMeta.map((reading) => (
                <List.Item
                  key={reading.id}
                  title={reading.label}
                  description={`Duración: ${reading.durationLabel} · ${reading.timestampLabel}`}
                  left={(props) => <List.Icon {...props} icon="chart-line" />}
                  style={styles.readingItem}
                  titleStyle={[styles.readingTitle, { color: reading.valueColor }]}
                  descriptionStyle={styles.readingDescription}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={customModalVisible}
          onDismiss={() => setCustomModalVisible(false)}
          contentContainerStyle={[
            styles.modalContent,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Filtrar por fecha
          </Text>

          <Text variant="labelSmall" style={styles.modalLabel}>
            Desde
          </Text>
          <Button
            mode="outlined"
            icon="calendar"
            onPress={() =>
              DateTimePickerAndroid.open({
                value: fromDate || new Date(),
                mode: "date",
                onChange: (event, date) => {
                  if (date) setFromDate(date);
                },
              })
            }
            style={styles.modalDateButton}
          >
            {fromDate ? fromDate.toLocaleDateString() : "Elegir fecha"}
          </Button>

          <Text variant="labelSmall" style={styles.modalLabel}>
            Hasta
          </Text>
          <Button
            mode="outlined"
            icon="calendar"
            onPress={() =>
              DateTimePickerAndroid.open({
                value: toDate || new Date(),
                mode: "date",
                onChange: (event, date) => {
                  if (date) setToDate(date);
                },
              })
            }
            style={styles.modalDateButton}
          >
            {toDate ? toDate.toLocaleDateString() : "Elegir fecha"}
          </Button>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setCustomModalVisible(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleApplyCustom}
              disabled={!fromDate && !toDate}
              style={styles.modalButton}
            >
              Aplicar
            </Button>
          </View>
        </Modal>
      </Portal>
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
  location: {
    opacity: 0.7,
    marginBottom: 16,
    textAlign: "center",
  },
  chipsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignSelf: "stretch",
    marginBottom: 24,
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
  metricsGrid: {
    alignSelf: "stretch",
    gap: 12,
    marginBottom: 18,
  },
  metricCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 6,
    borderLeftColor: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#eceff1",
    flexDirection: "column",
  },
  metricCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  metricIconSide: {
    flexShrink: 0,
  },
  metricTextBlock: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  metricSubvalue: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  typeChip: {
    backgroundColor: "#f0f0f0",
  },
  typeChipText: {
    color: "#666",
    fontWeight: "600",
    lineHeight: 16,
  },
  statusChip: {},
  statusChipText: {
    fontWeight: "600",
    lineHeight: 16,
  },
  pairingButton: {
    alignSelf: "stretch",
    marginBottom: 16,
  },
  configButton: {
    alignSelf: "stretch",
    marginBottom: 18,
    borderRadius: 12,
    borderColor: "#9FE1CB",
    backgroundColor: "#F7FFFB",
  },
  configButtonContent: {
    height: 42,
  },
  configButtonLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: "#1D9E75",
  },
  readingsSection: {
    width: "100%",
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  presetsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  presetChip: {
    marginRight: 0,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    paddingVertical: 20,
  },
  readingsList: {
    paddingHorizontal: 0,
  },
  readingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  readingTitle: {
    fontWeight: '700',
  },
  readingDescription: {
    opacity: 0.75,
  },
  readingsLoader: {
    paddingVertical: 24,
  },
  modalContent: {
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: "700",
    marginBottom: 16,
  },
  modalLabel: {
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 4,
  },
  modalDateButton: {
    marginBottom: 12,
    alignSelf: "stretch",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  modalButton: {
    minWidth: 90,
  },
});
