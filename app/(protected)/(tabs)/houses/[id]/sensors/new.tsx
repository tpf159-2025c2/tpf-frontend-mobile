import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, HelperText, Appbar, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import houseService from '@/services/houseService';
import { SensorType, SENSOR_TYPE_LABELS } from '@/services/types';

const SENSOR_TYPES: { value: SensorType; label: string }[] = [
  { value: 'MOTION', label: SENSOR_TYPE_LABELS.MOTION },
  { value: 'MAGNETIC', label: SENSOR_TYPE_LABELS.MAGNETIC },
  { value: 'GAS', label: SENSOR_TYPE_LABELS.GAS },
  { value: 'SOUND', label: SENSOR_TYPE_LABELS.SOUND },
];

export default function NewSensorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [type, setType] = useState<SensorType>('MOTION');
  const [hardwareId, setHardwareId] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !type || !hardwareId.trim()) {
      setError('Por favor completa los campos requeridos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await houseService.createSensor(id!, {
        name: name.trim(),
        type,
        hardwareId: hardwareId.trim(),
        location: location.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear sensor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ marginTop: insets.top }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Agregar Sensor" />
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
            placeholder="Ej: Sensor Temperatura Sala"
            disabled={loading}
            style={styles.input}
          />

          <View style={[styles.pickerContainer, { borderColor: theme.colors.outline }]}>
            <Picker
              selectedValue={type}
              onValueChange={(value) => setType(value)}
              enabled={!loading}
              style={styles.picker}
            >
              {SENSOR_TYPES.map((t) => (
                <Picker.Item key={t.value} label={t.label} value={t.value} />
              ))}
            </Picker>
          </View>

          <TextInput
            label="Hardware ID"
            value={hardwareId}
            onChangeText={setHardwareId}
            mode="outlined"
            placeholder="Ej: HW-001"
            disabled={loading}
            style={styles.input}
          />

          <TextInput
            label="Ubicacion (opcional)"
            value={location}
            onChangeText={setLocation}
            mode="outlined"
            placeholder="Ej: Sala principal"
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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: {
    height: 50,
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
