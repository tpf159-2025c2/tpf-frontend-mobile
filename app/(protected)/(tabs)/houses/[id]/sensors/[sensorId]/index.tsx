import { useState, useEffect, useCallback } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import houseService from "@/services/houseService";
import {
  Sensor,
  SensorReading,
  SENSOR_TYPE_LABELS,
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

  const fetchData = useCallback(async () => {
    if (!id || !sensorId) return;

    try {
      const [sensorData, metricsData] = await Promise.all([
        houseService.getSensor(id, sensorId),
        houseService.getSensorMetrics(id, sensorId),
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const fetchReadings = async (from: Date | null, to: Date | null) => {
    if (!id || !sensorId) return;
    setReadingsLoading(true);
    try {
      const params: { from?: string; to?: string } = {};
      if (from) params.from = from.toISOString();
      if (to) params.to = to.toISOString();

      const metricsData = await houseService.getSensorMetrics(
        id,
        sensorId,
        params,
      );
      setReadings(metricsData.readings || []);
    } catch (err) {
      console.error("Error filtering readings:", err);
    } finally {
      setReadingsLoading(false);
    }
  };

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
    fetchReadings(from, now);
  };

  const handleApplyCustom = () => {
    setActivePreset("custom");
    setCustomModalVisible(false);
    fetchReadings(fromDate, toDate);
  };

  const handleClear = () => {
    setActivePreset(null);
    setFromDate(null);
    setToDate(null);
    fetchReadings(null, null);
  };

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
          <Button onPress={fetchData} style={{ marginTop: 16 }}>
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
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
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
          <Chip
            compact
            style={[styles.statusChip, { backgroundColor: statusColor + "20" }]}
            textStyle={[styles.statusChipText, { color: statusColor }]}
          >
            {SENSOR_STATUS_LABELS[sensor.status]}
          </Chip>
        </View>

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

        <Card style={styles.detailCard}>
          <Card.Content>
            <View style={styles.fieldHeader}>
              <Ionicons name="barcode-outline" size={14} color="#666" />
              <Text variant="labelSmall" style={styles.fieldLabel}>
                Hardware ID
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              style={[styles.fieldValue, styles.idText]}
            >
              {sensor.hardwareId}
            </Text>
          </Card.Content>
        </Card>

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
          ) : readings.length === 0 ? (
            <Text style={styles.emptyText}>Sin lecturas disponibles</Text>
          ) : (
            <View style={styles.readingsList}>
              {readings.map((reading) => (
                <List.Item
                  key={reading.id}
                  title={reading.value}
                  description={new Date(reading.timestamp).toLocaleString()}
                  left={(props) => <List.Icon {...props} icon="chart-line" />}
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
  detailCard: {
    width: "100%",
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    textAlign: "center",
    fontWeight: "600",
    paddingVertical: 4,
  },
  idText: {
    fontFamily: "monospace",
    opacity: 0.7,
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
