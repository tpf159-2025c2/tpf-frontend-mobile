import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text as RNText } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  ActivityIndicator,
  useTheme,
  Appbar,
  Chip,
  List,
  Divider,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import BaseCard from '@/components/BaseCard';
import AddCard from '@/components/AddCard';
import ActionsBottomSheet from '@/components/ActionsBottomSheet';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import houseService from '@/services/houseService';
import {
  House,
  Sensor,
  SensorReading,
  Member,
  SENSOR_TYPE_LABELS,
  SENSOR_TYPE_COLORS,
  SENSOR_STATUS_LABELS,
  SENSOR_STATUS_COLORS,
  MEMBER_ROLE_LABELS,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_COLORS,
} from '@/services/types';

const SENSOR_IONICONS: Record<string, string> = {
  MOTION: 'eye-outline',
  MAGNETIC: 'magnet-outline',
  GAS: 'flame-outline',
  SOUND: 'volume-medium-outline',
};



const ONLINE_COLOR = '#1D9E75';
const OFFLINE_COLOR = '#9CA3AF';

const VALUE_COLORS: Record<string, string> = {
  '1': '#e67e22',
  '0': '#28a745',
};

const READING_VALUE_LABELS: Partial<Record<string, Record<string, string>>> = {
  MAGNETIC: { 1: 'Abierta', 0: 'Cerrada' },
  GAS: { 1: 'Fuga detectada', 0: 'Sin fuga' },
  SOUND: { 1: 'Sonido detectado', 0: 'Silencioso' },
  MOTION: { 1: 'Movimiento detectado', 0: 'Sin movimiento' },
};

function getReadingLabel(sensorType: string, value: string) {
  const normalized = Number(value);
  const labels = READING_VALUE_LABELS[sensorType];
  if (labels && (normalized === 0 || normalized === 1)) return labels[String(normalized)] ?? value;
  return value;
}

function getBatteryIcon(level?: number | null) {
  if (level == null) return null;
  if (level >= 76) return { name: 'battery-full', color: '#1D9E75' };
  if (level >= 51) return { name: 'battery-half', color: '#1D9E75' };
  if (level >= 26) return { name: 'battery-half', color: '#EF9F27' };
  return { name: 'battery-dead', color: '#dc3545' };
}

function getHouseConnectionState(lastOnlineAt?: string | null) {
  if (!lastOnlineAt) return false;

  const lastOnlineTime = new Date(lastOnlineAt).getTime();
  if (Number.isNaN(lastOnlineTime)) return false;

  return Date.now() - lastOnlineTime < 10 * 60 * 1000;
}

const AVATAR_COLORS = ['#1D9E75', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function HouseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const [house, setHouse] = useState<House | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [latestReadings, setLatestReadings] = useState<Record<string, SensorReading | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);

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
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  useEffect(() => {
    if (!id || sensors.length === 0) return;

    let mounted = true;

    const fetchLatestForSensors = async () => {
      try {
        const promises = sensors.map(async (s) => {
          try {
            const data = await houseService.getSensorMetrics(id, s.id);
            const readings = data.readings || [];
            if (!readings.length) return { id: s.id, latest: null };
            const latest = readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            return { id: s.id, latest };
          } catch (e) {
            return { id: s.id, latest: null };
          }
        });

        const results = await Promise.all(promises);
        if (!mounted) return;
        const map: Record<string, SensorReading | null> = {};
        for (const r of results) map[r.id] = r.latest;
        setLatestReadings(map);
      } catch (err) {
        console.error('Error al cargar últimas lecturas', err);
      }
    };

    fetchLatestForSensors();

    return () => {
      mounted = false;
    };
  }, [sensors, id]);

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

  const houseIsOnline = getHouseConnectionState(house?.lastOnlineAt);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={house?.name || 'Casa'} titleStyle={{ fontSize: 16 }} />
        <Appbar.Action icon="dots-vertical" onPress={() => setSheetVisible(true)} />
      </Appbar.Header>

      <ActionsBottomSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        actions={[
          {
            icon: 'pencil-outline',
            label: 'Editar',
            onPress: () => router.push(`/(protected)/(tabs)/houses/${id}/edit` as any),
          },
          {
            icon: 'trash-outline',
            label: 'Eliminar',
            destructive: true,
            onPress: () => router.push(`/(protected)/(tabs)/houses/${id}/delete` as any),
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.headerInfo}>
          <View style={styles.addressRow}>
            <Ionicons name="git-network-outline" size={16} color="#999" />
            <Text variant="bodySmall" style={styles.address}>
              {house?.address}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Sensores
          </Text>
          <Text variant="bodySmall" style={styles.sectionSubtitle}>
            Monitoreo en tiempo real
          </Text>
        </View>

          {(() => {
          const sortedSensors = [...sensors].filter((s) => s.status === 'ACCEPTED').sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
          const BANNER_HEIGHT = 78;

          return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sensorsScroll} contentContainerStyle={styles.sensorsGrid}>
              {sortedSensors.map((sensor) => {
            const isOnline = houseIsOnline ? Boolean(sensor.online) : false;
            const onlineColor = isOnline ? ONLINE_COLOR : OFFLINE_COLOR;
            const battery = getBatteryIcon(sensor.batteryLevel);
            return (
              <BaseCard
                key={sensor.id}
                style={styles.sensorCard}
                onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/sensors/${sensor.id}`)}
                bannerColor={SENSOR_TYPE_COLORS[sensor.type] ?? '#1D9E75'}
                bannerHeight={BANNER_HEIGHT}
                bannerContent={<Ionicons name={SENSOR_IONICONS[sensor.type] as any ?? 'thermometer-outline'} size={28} color="rgba(255,255,255,0.9)" />}
                bodyContent={
                  <>
                    <RNText style={styles.sensorName} numberOfLines={1}>{sensor.name}</RNText>
                    <View style={styles.sensorMetaList}>
                      <View style={styles.sensorMetaRow}>
                        <Ionicons name={isOnline ? 'wifi' : 'wifi-outline'} size={12} color={onlineColor} />
                        <RNText style={[styles.sensorMetaText, { color: onlineColor }]}>
                          {isOnline ? 'En línea' : 'Sin conexión'}
                        </RNText>
                        {battery ? (
                          <>
                            <View style={{ width: 8 }} />
                            <Ionicons name={battery.name as any} size={12} color={isOnline ? battery.color : OFFLINE_COLOR} />
                            <RNText style={[styles.sensorMetaText, { color: isOnline ? battery.color : OFFLINE_COLOR }]}>
                              {sensor.batteryLevel}%
                            </RNText>
                          </>
                        ) : null}
                      </View>
                      <View style={styles.sensorMetaRow}>
                        {sensor.location ? (
                          <>
                            <Ionicons name="location-outline" size={12} color="#6B7280" />
                            <RNText style={styles.sensorMetaText} numberOfLines={1}>{sensor.location}</RNText>
                          </>
                        ) : null}
                      </View>
                    </View>
                  </>
                }
                footerContent={
                  <>
                        <View style={styles.sensorFooterRow}>
                          {(() => {
                            const latest = latestReadings[sensor.id];
                            const hasLatestKey = Object.prototype.hasOwnProperty.call(latestReadings, sensor.id);
                            if (!hasLatestKey) return null;
                            const label = latest ? getReadingLabel(sensor.type, latest.value) : SENSOR_STATUS_LABELS[sensor.status];
                            const valueKey = latest ? String(latest.value) : undefined;
                            const color = latest ? (VALUE_COLORS[valueKey ?? '1'] ?? '#e67e22') : (SENSOR_STATUS_COLORS[sensor.status] ?? '#6c757d');
                            const bg = color + '20';
                            const displayLabel = label;
                            return (
                              <View style={[styles.sensorStatusBadge, { backgroundColor: bg }]}>
                                <RNText style={[styles.sensorStatusText, { color }]}>{displayLabel}</RNText>
                              </View>
                            );
                          })()}

                          <Ionicons name="chevron-forward" size={11} color="#bbb" style={{ marginLeft: 'auto' }} />
                        </View>
                  </>
                }
              />
            );
              })}
          <AddCard
            icon="add-circle-outline"
            label={`Agregar\nsensor`}
            onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/sensors/new`)}
          />
            </ScrollView>
          );
        })()}

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Miembros
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll} contentContainerStyle={styles.membersList}>
            {members.map((member) => {
              const displayName = member.name || 'Pendiente';
              const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
              const bgColor = member.name ? avatarColor(member.name) : '#999';
              return (
                <BaseCard
                  key={member.membershipId}
                  style={styles.memberCard}
                  onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/members/${member.membershipId}`)}
                  bannerColor={bgColor}
                  bannerHeight={80}
                  bannerContent={<RNText style={styles.memberInitials}>{initials}</RNText>}
                  bodyContent={
                    <>
                      <RNText style={[styles.memberName, !member.name && { opacity: 0.6, fontStyle: 'italic' }]}>
                        {displayName}
                      </RNText>
                      <RNText style={styles.memberEmail} numberOfLines={1}>{member.email}</RNText>
                    </>
                  }
                  footerContent={
                    <>
                      <View style={styles.memberRoleBadge}>
                        <RNText style={styles.memberRoleText}>{MEMBER_ROLE_LABELS[member.role]}</RNText>
                      </View>
                      <View style={[styles.memberStatusBadge, { backgroundColor: (MEMBER_STATUS_COLORS[member.status] ?? '#6c757d') + '20' }]}>
                        <RNText style={[styles.memberStatusText, { color: MEMBER_STATUS_COLORS[member.status] ?? '#6c757d' }]}>
                          {MEMBER_STATUS_LABELS[member.status]}
                        </RNText>
                      </View>
                      <Ionicons name="chevron-forward" size={11} color="#bbb" style={{ marginLeft: 'auto' }} />
                    </>
                  }
                />
              );
            })}
          <AddCard
            icon="person-add-outline"
            label={`Agregar\nmiembro`}
            onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/members/new`)}
          />
        </ScrollView>

        <View style={{ height: 40 }} />
      </View>
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
    paddingVertical: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 6,
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
  sensorsScroll: {
    height: 215,
  },
  sensorsGrid: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  sensorCard: {
    width: 210,
    alignSelf: 'stretch',
  },
  sensorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  sensorMetaList: {
    gap: 6,
  },
  sensorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 16,
  },
  sensorMetaText: {
    fontSize: 12,
    color: '#6B7280',
    flexShrink: 1,
  },
  sensorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sensorBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sensorStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    marginRight: 8,
  },
  sensorStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sensorFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
  },
  membersScroll: {
    height: 200,
  },
  membersList: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  memberCard: {
    width: 200,
  },
  memberInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 12,
    color: '#999',
  },
  memberRoleBadge: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  memberStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    marginLeft: 4,
  },
  memberStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  memberRoleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D9E75',
  },
});
