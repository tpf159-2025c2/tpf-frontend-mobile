import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, Appbar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import houseService from '@/services/houseService';

export default function NewHouseScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !address.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await houseService.createHouse({
        name: name.trim(),
        address: address.trim(),
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear casa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ marginTop: insets.top }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Agregar Casa" />
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
            placeholder="Ej: Casa Principal"
            disabled={loading}
            style={styles.input}
          />

          <TextInput
            label="Direccion MAC"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            placeholder="Ej: AA:BB:CC:DD:EE:FF"
            autoCapitalize="characters"
            disabled={loading}
            style={styles.input}
          />

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={loading}
              style={styles.button}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleCreate}
              loading={loading}
              disabled={loading}
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
