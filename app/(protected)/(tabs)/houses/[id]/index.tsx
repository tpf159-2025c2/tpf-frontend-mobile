import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
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
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import houseService from '@/services/houseService';
import {
  House,
  Sensor,
  Member,
  SENSOR_TYPE_LABELS,
  SENSOR_STATUS_LABELS,
  SENSOR_STATUS_COLORS,
  SENSOR_ICONS,
  MEMBER_ROLE_LABELS,
} from '@/services/types';

export default function HouseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [house, setHouse] = useState<House | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      const [houseData, sensorsData, membersData] = await Promise.all([
        houseService.getHouse(id),
        houseService.getSensors(id),
        houseService.getMembers(id),
      ]);
      setHouse(houseData);
      setSensors(sensorsData);
      setMembers(membersData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ marginTop: insets.top }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={house?.name || 'Casa'} />
        <Appbar.Action
          icon="pencil"
          onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/edit`)}
        />
        <Appbar.Action
          icon="delete"
          onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/delete`)}
        />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerInfo}>
          <Text variant="bodyLarge" style={styles.address}>
            {house?.address}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/sensors/new`)}
            style={styles.actionButton}
          >
            Agregar Sensor
          </Button>
          <Button
            mode="outlined"
            icon="account-plus"
            onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/members/new`)}
            style={styles.actionButton}
          >
            Agregar Miembro
          </Button>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Sensores
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Monitoreo en tiempo real
          </Text>
        </View>

        {sensors.length === 0 ? (
          <Text style={styles.emptyText}>No hay sensores registrados</Text>
        ) : (
          <View style={styles.sensorsGrid}>
            {sensors.map((sensor) => (
              <Card
                key={sensor.id}
                style={styles.sensorCard}
                onPress={() =>
                  router.push(`/(protected)/(tabs)/houses/${id}/sensors/${sensor.id}`)
                }
              >
                <Card.Content style={styles.sensorContent}>
                  <IconButton
                    icon={SENSOR_ICONS[sensor.type] || 'chart-bar'}
                    size={32}
                    style={styles.sensorIcon}
                  />
                  <Text variant="titleSmall" numberOfLines={1}>
                    {sensor.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.sensorType}>
                    {SENSOR_TYPE_LABELS[sensor.type]}
                  </Text>
                  <Chip
                    compact
                    style={[
                      styles.statusChip,
                      { backgroundColor: SENSOR_STATUS_COLORS[sensor.status] + '20' },
                    ]}
                    textStyle={{ color: SENSOR_STATUS_COLORS[sensor.status], fontSize: 10 }}
                  >
                    {SENSOR_STATUS_LABELS[sensor.status]}
                  </Chip>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <Divider style={styles.divider} />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Miembros
          </Text>
        </View>

        {members.length === 0 ? (
          <Text style={styles.emptyText}>No hay miembros registrados</Text>
        ) : (
          <View style={styles.membersList}>
            {members.map((member) => (
              <List.Item
                key={member.membershipId}
                title={member.name}
                description={`${member.email} - ${MEMBER_ROLE_LABELS[member.role]}`}
                left={(props) => <List.Icon {...props} icon="account" />}
                right={() => (
                  <View style={styles.memberActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() =>
                        router.push(
                          `/(protected)/(tabs)/houses/${id}/members/${member.membershipId}/edit`
                        )
                      }
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() =>
                        router.push(
                          `/(protected)/(tabs)/houses/${id}/members/${member.membershipId}/delete`
                        )
                      }
                    />
                  </View>
                )}
                style={styles.memberItem}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  headerInfo: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  address: {
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  divider: {
    marginVertical: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    opacity: 0.7,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.7,
    paddingVertical: 20,
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  sensorCard: {
    width: '47%',
  },
  sensorContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sensorIcon: {
    margin: 0,
  },
  sensorType: {
    opacity: 0.7,
    marginTop: 2,
  },
  statusChip: {
    marginTop: 8,
  },
  membersList: {
    paddingHorizontal: 8,
  },
  memberItem: {
    paddingVertical: 4,
  },
  memberActions: {
    flexDirection: 'row',
  },
});
