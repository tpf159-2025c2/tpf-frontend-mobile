import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  ActivityIndicator,
  useTheme,
  Appbar,
  Chip,
  List,
  Button,
  Modal,
  Portal,
} from "react-native-paper";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import houseService from "@/services/houseService";
import { Sensor, SensorReading, SensorType } from "@/services/types";

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

export default function SensorReadingsScreen() {
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

  type Preset = "today" | "week" | "month" | "custom";
  const [activePreset, setActivePreset] = useState<Preset | null>("today");
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
      setError(err instanceof Error ? err.message : "Error al cargar lecturas");
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

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !sensor) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Lecturas" />
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Lecturas" subtitle={sensor.name} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Historial
          </Text>
          {activePreset !== null && (
            <Chip icon="close" onPress={handleClear} disabled={readingsLoading} compact>
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
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
  },
  readingTitle: {
    fontWeight: "700",
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
