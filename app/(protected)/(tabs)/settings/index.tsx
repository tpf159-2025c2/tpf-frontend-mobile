import { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, List, Button, Divider, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '@/hooks/useAuthStore';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [loggingOut, setLoggingOut] = useState(false);

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
  logoutSection: {
    padding: 20,
    paddingTop: 30,
  },
  logoutButton: {
    borderColor: '#dc3545',
  },
});
