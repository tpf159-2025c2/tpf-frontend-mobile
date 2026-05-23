import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text as RNText } from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  useTheme,
  Appbar,
  Card,
  Chip,
  Menu,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import houseService from '@/services/houseService';
import {
  Member,
  MEMBER_ROLE_LABELS,
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_COLORS,
} from '@/services/types';

const AVATAR_COLORS = ['#1D9E75', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MemberDetailsScreen() {
  const router = useRouter();
  const { id, memberId } = useLocalSearchParams<{ id: string; memberId: string }>();
  const theme = useTheme();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id || !memberId) return;
    try {
      const members = await houseService.getMembers(id);
      const found = members.find((m) => m.membershipId === memberId) ?? null;
      if (!found) {
        setError('Miembro no encontrado');
      } else {
        setMember(found);
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [id, memberId]);

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

  if (error || !member) {
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

  const displayName = member.name || 'Pendiente';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const bgColor = member.name ? avatarColor(member.name) : '#999';
  const statusColor = MEMBER_STATUS_COLORS[member.status] ?? '#6c757d';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="" />
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
              router.push(
                `/(protected)/(tabs)/houses/${id}/members/${memberId}/edit`,
              );
            }}
            title="Editar"
          />
          <Menu.Item
            leadingIcon="delete"
            onPress={() => {
              setMenuVisible(false);
              router.push(
                `/(protected)/(tabs)/houses/${id}/members/${memberId}/delete`,
              );
            }}
            title="Eliminar"
            titleStyle={{ color: theme.colors.error }}
          />
        </Menu>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.avatar, { backgroundColor: bgColor }]}>
          <RNText style={styles.avatarText}>{initials}</RNText>
        </View>

        <Text variant="titleLarge" style={styles.name}>
          {displayName}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {member.email}
        </Text>

        <View style={styles.chipsRow}>
          <Chip compact style={styles.roleChip} textStyle={styles.roleChipText}>
            {MEMBER_ROLE_LABELS[member.role]}
          </Chip>
          <Chip
            compact
            style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
            textStyle={[styles.statusChipText, { color: statusColor, fontWeight: '600' }]}
          >
            {MEMBER_STATUS_LABELS[member.status]}
          </Chip>
        </View>

        <Card style={styles.detailCard}>
          <Card.Content>
            <View style={styles.fieldHeader}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text variant="labelSmall" style={styles.fieldLabel}>
                Miembro desde
              </Text>
            </View>
            <Text variant="headlineSmall" style={styles.fieldValue}>
              {new Date(member.createdAt).toLocaleDateString()}
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.detailCard}>
          <Card.Content>
            <View style={styles.fieldHeader}>
              <Ionicons name="card-outline" size={14} color="#666" />
              <Text variant="labelSmall" style={styles.fieldLabel}>
                ID de membresía
              </Text>
            </View>
            <Text
              variant="bodyMedium"
              style={[styles.fieldValue, styles.idText]}
            >
              {member.membershipId}
            </Text>
          </Card.Content>
        </Card>
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
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
  },
  name: {
    fontWeight: '700',
    marginBottom: 4,
  },
  email: {
    opacity: 0.7,
    marginBottom: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  detailCard: {
    width: '100%',
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    textAlign: 'center',
    fontWeight: '600',
    paddingVertical: 4,
  },
  roleChip: {
    backgroundColor: '#e8f0fe',
  },
  roleChipText: {
    color: '#1D9E75',
    fontWeight: '600',
    lineHeight: 16,
  },
  statusChip: {},
  statusChipText: {
    lineHeight: 16,
  },
  divider: {
    marginVertical: 4,
  },
  idText: {
    fontFamily: 'monospace',
    opacity: 0.7,
  },
});
