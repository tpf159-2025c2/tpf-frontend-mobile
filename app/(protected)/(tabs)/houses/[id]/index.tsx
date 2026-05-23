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
  Menu,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import BaseCard from '@/components/BaseCard';
import AddCard from '@/components/AddCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import houseService from '@/services/houseService';
import {
  House,
  Sensor,
  Member,
  SENSOR_TYPE_LABELS,
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

const STATUS_ICON: Record<string, string> = {
  ACCEPTED: 'ellipse',
  PENDING: 'time-outline',
  REJECTED: 'close-circle-outline',
};

const STATUS_COLOR: Record<string, string> = {
  ACCEPTED: '#1D9E75',
  PENDING: '#EF9F27',
  REJECTED: '#dc3545',
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

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

  useEffect(() => {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={house?.name || 'Casa'} titleStyle={{ fontSize: 16 }} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item
            leadingIcon="pencil"
            onPress={() => {
              setMenuVisible(false);
              router.push(`/(protected)/(tabs)/houses/${id}/edit`);
            }}
            title="Editar"
          />
          <Menu.Item
            leadingIcon="delete"
            onPress={() => {
              setMenuVisible(false);
              router.push(`/(protected)/(tabs)/houses/${id}/delete`);
            }}
            title="Eliminar"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </Appbar.Header>

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sensorsScroll} contentContainerStyle={styles.sensorsGrid}>
          {sensors.map((sensor) => {
            const statusColor = STATUS_COLOR[sensor.status] ?? '#666';
            return (
              <BaseCard
                key={sensor.id}
                style={styles.sensorCard}
                onPress={() => router.push(`/(protected)/(tabs)/houses/${id}/sensors/${sensor.id}`)}
                bannerColor="#1D9E75"
                bannerHeight={70}
                cardOpacity={sensor.status === 'REJECTED' ? 0.5 : sensor.status === 'PENDING' ? 0.75 : 1}
                bannerContent={
                  <Ionicons name={SENSOR_IONICONS[sensor.type] as any ?? 'thermometer-outline'} size={28} color="rgba(255,255,255,0.9)" />
                }
                bodyContent={
                  <>
                    <RNText style={styles.sensorName} numberOfLines={1}>{sensor.name}</RNText>
                    {sensor.location ? (
                      <View style={styles.sensorRow}>
                        <Ionicons name="location-outline" size={11} color="#999" />
                        <RNText style={styles.sensorLocation} numberOfLines={1}>{sensor.location}</RNText>
                      </View>
                    ) : null}
                    <RNText style={styles.sensorHwId} numberOfLines={1}>{sensor.hardwareId}</RNText>
                  </>
                }
                footerContent={
                  <>
                    <View style={styles.sensorStatusRow}>
                      <Ionicons name={STATUS_ICON[sensor.status] as any ?? 'ellipse'} size={8} color={statusColor} />
                      <RNText style={[styles.sensorStatusText, { color: statusColor }]}>
                        {SENSOR_STATUS_LABELS[sensor.status]}
                      </RNText>
                    </View>
                    <View style={styles.sensorBadge}>
                      <RNText style={styles.sensorBadgeText}>{SENSOR_TYPE_LABELS[sensor.type]}</RNText>
                    </View>
                    <Ionicons name="chevron-forward" size={11} color="#bbb" />
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
    height: 180,
  },
  sensorsGrid: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sensorCard: {
    width: 200,
  },
  sensorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  sensorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sensorLocation: {
    fontSize: 12,
    color: '#666',
  },
  sensorHwId: {
    fontSize: 11,
    color: '#bbb',
    fontFamily: 'monospace',
  },
  sensorStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  sensorStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sensorBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
  },
  sensorBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
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
