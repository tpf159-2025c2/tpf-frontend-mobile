import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Appbar, useTheme, Card } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import houseService from '@/services/houseService';

export default function DeleteMemberScreen() {
  const router = useRouter();
  const { id, memberId } = useLocalSearchParams<{ id: string; memberId: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!id || !memberId) return;

    setError('');
    setLoading(true);

    try {
      await houseService.deleteMember(id, memberId);
      router.replace(`/(protected)/(tabs)/houses/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar miembro');
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ marginTop: insets.top }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Eliminar Miembro" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.title}>
              Confirmar eliminacion
            </Text>
            <Text variant="bodyMedium" style={styles.description}>
              Esta accion eliminara al miembro de la casa. El usuario podra ser agregado nuevamente mas tarde.
            </Text>

            {error ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            ) : null}
          </Card.Content>

          <Card.Actions style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleDelete}
              loading={loading}
              disabled={loading}
              buttonColor={theme.colors.error}
            >
              Eliminar
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    padding: 8,
  },
  title: {
    marginBottom: 12,
  },
  description: {
    opacity: 0.7,
    marginBottom: 8,
  },
  errorText: {
    marginTop: 12,
  },
  actions: {
    justifyContent: 'flex-end',
    paddingTop: 16,
  },
});
