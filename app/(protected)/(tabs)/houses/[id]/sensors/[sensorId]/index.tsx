import { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  ActivityIndicator,
  useTheme,
  Appbar,
  Chip,
  List,
  Divider,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import houseService from "@/services/houseService";
import {
  Sensor,
  SensorReading,
  SENSOR_TYPE_LABELS,
  SENSOR_STATUS_LABELS,
  SENSOR_STATUS_COLORS,
  SENSOR_ICONS,
} from "@/services/types";

export default function SensorDetailsScreen() {
  const router = useRouter();
  const { id, sensorId } = useLocalSearchParams<{
    id: string;
    sensorId: string;
  }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [error, setError] = useState("");

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!id || !sensorId) return;

    try {
      const [sensorData, metricsData] = await Promise.all([
        houseService.getSensor(id, sensorId),
        houseService.getSensorMetrics(id, sensorId),
      ]);
      console.log(sensorData);
      
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

  const handleFilter = async () => {
    if (!id || !sensorId) return;

    setReadingsLoading(true);
    try {
      const params: { from?: string; to?: string } = {};
      if (fromDate) params.from = fromDate.toISOString();
      if (toDate) params.to = toDate.toISOString();

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

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header style={{ marginTop: insets.top }}>
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

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ marginTop: insets.top }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={sensor?.name || "Sensor"} />
        <Appbar.Action
          icon="pencil"
          onPress={() =>
            router.push(
              `/(protected)/(tabs)/houses/${id}/sensors/${sensorId}/edit`,
            )
          }
        />
        <Appbar.Action
          icon="delete"
          onPress={() =>
            router.push(
              `/(protected)/(tabs)/houses/${id}/sensors/${sensorId}/delete`,
            )
          }
        />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sensor?.status === "PENDING" && (
          <View style={styles.pairingBanner}>
            <Button
              mode="contained"
              icon="link"
              onPress={() =>
                router.push(
                  `/(protected)/(tabs)/houses/${id}/sensors/${sensorId}/pairing`,
                )
              }
            >
              Aceptar Emparejamiento
            </Button>
          </View>
        )}

        <Card style={styles.detailCard}>
          <Card.Content>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Estado
              </Text>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      SENSOR_STATUS_COLORS[sensor!.status] + "20",
                  },
                ]}
                textStyle={{ color: SENSOR_STATUS_COLORS[sensor!.status] }}
              >
                {SENSOR_STATUS_LABELS[sensor!.status]}
              </Chip>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Tipo
              </Text>
              <Text variant="bodyMedium">
                {SENSOR_TYPE_LABELS[sensor!.type]}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>
                Hardware ID
              </Text>
              <Text variant="bodyMedium">{sensor!.hardwareId}</Text>
            </View>

            {sensor?.location && (
              <View style={styles.detailRow}>
                <Text variant="bodyMedium" style={styles.detailLabel}>
                  Ubicacion
                </Text>
                <Text variant="bodyMedium">{sensor.location}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Lecturas
          </Text>
        </View>

        <View style={styles.filterContainer}>
          <Button
            mode="outlined"
            onPress={() =>
              DateTimePickerAndroid.open({
                value: fromDate || new Date(),
                mode: "date",
                onChange: (event, date) => { if (date) setFromDate(date); },
              })
            }
            compact
            style={styles.dateButton}
          >
            {fromDate ? fromDate.toLocaleDateString() : "Desde"}
          </Button>
          <Button
            mode="outlined"
            onPress={() =>
              DateTimePickerAndroid.open({
                value: toDate || new Date(),
                mode: "date",
                onChange: (event, date) => { if (date) setToDate(date); },
              })
            }
            compact
            style={styles.dateButton}
          >
            {toDate ? toDate.toLocaleDateString() : "Hasta"}
          </Button>
          <Button
            mode="contained"
            onPress={handleFilter}
            loading={readingsLoading}
            disabled={readingsLoading}
            compact
          >
            Filtrar
          </Button>
        </View>

        {readings.length === 0 ? (
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

        <View style={{ height: 40 }} />
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
    flex: 1,
  },
  pairingBanner: {
    padding: 16,
    alignItems: "center",
  },
  detailCard: {
    margin: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    opacity: 0.7,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.7,
    paddingVertical: 20,
  },
  readingsList: {
    paddingHorizontal: 8,
  },
});
