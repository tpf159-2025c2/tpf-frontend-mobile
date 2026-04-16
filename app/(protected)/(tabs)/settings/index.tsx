import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Button, Divider, useTheme, Switch, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '@/hooks/useAuthStore';
import userService from '@/services/userService';
import { NotificationPreferences } from '@/services/types';

const NOTIFICATION_ITEMS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  {
    key: 'mobile',
    label: 'Notificaciones push',
    description: 'Recibí alertas en tiempo real sobre el estado de tu hogar en esta app.',
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Recibí alertas sobre el estado de tu hogar por correo electrónico.',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [loggingOut, setLoggingOut] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({ mobile: false, email: false });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState('');
  const [toggling, setToggling] = useState<keyof NotificationPreferences | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    try {
      const data = await userService.getNotificationPreferences(user.id);
      setPreferences(data);
      setPrefsError('');
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : 'Error al cargar preferencias');
    } finally {
      setPrefsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user || toggling) return;

    setToggling(key);
    setPreferences((prev) => ({ ...prev, [key]: value }));

    try {
      const updated = await userService.updateNotificationPreferences(user.id, { [key]: value });
      setPreferences(updated);
    } catch (err) {
      setPreferences((prev) => ({ ...prev, [key]: !value }));
      setPrefsError(err instanceof Error ? err.message : 'Error al actualizar preferencias');
    } finally {
      setToggling(null);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesion',
      'Estas seguro de que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesion',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text variant="headlineMedium" style={styles.title}>
          Ajustes
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <List.Section>
          <List.Subheader>Cuenta</List.Subheader>
          <List.Item
            title={user?.name || 'Usuario'}
            description={user?.email || ''}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Notificaciones</List.Subheader>

          {prefsLoading ? (
            <ActivityIndicator style={styles.prefsLoader} color={theme.colors.primary} />
          ) : prefsError ? (
            <View style={styles.prefsError}>
              <Text style={{ color: theme.colors.error, fontSize: 13 }}>{prefsError}</Text>
              <Button compact onPress={fetchPreferences}>Reintentar</Button>
            </View>
          ) : (
            NOTIFICATION_ITEMS.map(({ key, label, description }) => (
              <List.Item
                key={key}
                title={label}
                description={description}
                descriptionNumberOfLines={2}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={key === 'mobile' ? 'bell-outline' : 'email-outline'}
                  />
                )}
                right={() => (
                  <Switch
                    value={preferences[key]}
                    onValueChange={(v) => handleToggle(key, v)}
                    disabled={toggling !== null}
                    color={theme.colors.primary}
                  />
                )}
                style={styles.prefItem}
              />
            ))
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Aplicacion</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
        </List.Section>

        <Divider />

        <View style={styles.logoutSection}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            loading={loggingOut}
            disabled={loggingOut}
            icon="logout"
            textColor={theme.colors.error}
            style={styles.logoutButton}
          >
            Cerrar sesion
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  prefsLoader: {
    marginVertical: 20,
  },
  prefsError: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  prefItem: {
    paddingVertical: 4,
  },
  logoutSection: {
    padding: 20,
    paddingTop: 30,
  },
  logoutButton: {
    borderColor: '#dc3545',
  },
});
