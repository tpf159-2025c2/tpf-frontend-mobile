import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Appbar, useTheme, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import houseService from '@/services/houseService';
import { Sensor, SENSOR_TYPE_LABELS } from '@/services/types';

const MAX_RETRIES = 10;
const POLL_INTERVAL_MS = 5000;

export default function NewSensorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [attempt, setAttempt] = useState(1);
  const [status, setStatus] = useState<'loading' | 'retrying' | 'done'>('loading');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = (currentAttempt: number) => {
    setAttempt(currentAttempt);
    setStatus('loading');

    houseService.getPairRequests(id!)
      .then((data) => {
        setSensors(data);
        if (currentAttempt >= MAX_RETRIES) {
          setStatus('done');
          return;
        }
        setStatus('retrying');
        timeoutRef.current = setTimeout(() => poll(currentAttempt + 1), POLL_INTERVAL_MS);
      })
      .catch(() => {
        if (currentAttempt >= MAX_RETRIES) {
          setStatus('done');
          return;
        }
        setStatus('retrying');
        timeoutRef.current = setTimeout(() => poll(currentAttempt + 1), POLL_INTERVAL_MS);
      });
  };

  useEffect(() => {
    poll(1);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleReset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSensors([]);
    poll(1);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ marginTop: insets.top }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Agregar Sensor" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={styles.title}>
          Sensores disponibles para emparejar
        </Text>

        <View style={styles.statusRow}>
          {status !== 'done' ? (
            <>
              <ActivityIndicator
                size="small"
                color={status === 'retrying' ? theme.colors.secondary : theme.colors.primary}
                style={styles.spinner}
              />
              <Text variant="bodySmall" style={styles.statusText}>
                Buscando sensores... ({attempt}/{MAX_RETRIES})
              </Text>
            </>
          ) : (
            <>
              <Text variant="bodySmall" style={styles.statusText}>
                Búsqueda finalizada.
              </Text>
              <Button mode="text" compact onPress={handleReset} style={styles.retryButton}>
                Buscar de nuevo
              </Button>
            </>
          )}
        </View>

        {sensors.length === 0 && status === 'done' ? (
          <Text style={styles.emptyText}>No se encontraron sensores pendientes.</Text>
        ) : (
          sensors.map((sensor) => (
            <Card key={sensor.id} style={styles.sensorCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.sensorInfo}>
                  <Text variant="titleSmall" style={styles.sensorName}>
                    {sensor.name}
                  </Text>
                  <Chip compact style={styles.typeChip}>
                    {SENSOR_TYPE_LABELS[sensor.type] ?? sensor.type}
                  </Chip>
                  <Text variant="bodySmall" style={styles.hardwareId}>
                    HW: {sensor.hardwareId}
                  </Text>
                  {sensor.location ? (
                    <Text variant="bodySmall" style={styles.location}>
                      {sensor.location}
                    </Text>
                  ) : null}
                </View>
                <Button
                  mode="contained"
                  compact
                  onPress={() =>
                    router.push(
                      `/(protected)/(tabs)/houses/${id}/sensors/${sensor.id}/pairing`,
                    )
                  }
                >
                  Emparejar
                </Button>
              </Card.Content>
            </Card>
          ))
        )}

        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          Volver
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  spinner: {
    marginRight: 4,
  },
  statusText: {
    opacity: 0.7,
    flex: 1,
  },
  retryButton: {
    marginLeft: 'auto',
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    paddingVertical: 40,
  },
  sensorCard: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sensorInfo: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  sensorName: {
    fontWeight: '600',
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  hardwareId: {
    opacity: 0.6,
  },
  location: {
    opacity: 0.6,
  },
  backButton: {
    marginTop: 24,
  },
});
