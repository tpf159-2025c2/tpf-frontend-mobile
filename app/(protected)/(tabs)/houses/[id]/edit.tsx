import { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar, useTheme, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import houseService from '@/services/houseService';

export default function EditHouseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchHouse = async () => {
      try {
        const house = await houseService.getHouse(id);
        setName(house.name);
        setAddress(house.address);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar casa');
      } finally {
        setLoading(false);
      }
    };

    fetchHouse();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setSaving(true);

    try {
      await houseService.updateHouse(id!, {
        name: name.trim(),
        address: address.trim(),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar casa');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Editar Casa" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {error ? (
            <HelperText type="error" visible={true} style={styles.error}>
              {error}
            </HelperText>
          ) : null}

          <TextInput
            label="Nombre"
            value={name}
            onChangeText={setName}
            mode="outlined"
            disabled={saving}
            style={styles.input}
          />

          <TextInput
            label="Direccion MAC"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            autoCapitalize="characters"
            disabled={saving}
            style={styles.input}
          />

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={saving}
              style={styles.button}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.button}
            >
              Guardar
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
  },
  error: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
});
