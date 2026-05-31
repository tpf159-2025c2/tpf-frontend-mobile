import { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  Appbar,
  useTheme,
  ActivityIndicator,
  Card,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import houseService from '@/services/houseService';
import { SensorType, SENSOR_TYPE_LABELS } from '@/services/types';

const SENSOR_TYPE_OPTIONS: { value: SensorType; label: string; icon: any }[] = [
  { value: 'MOTION', label: SENSOR_TYPE_LABELS.MOTION, icon: 'eye-outline' },
  { value: 'MAGNETIC', label: SENSOR_TYPE_LABELS.MAGNETIC, icon: 'magnet-outline' },
  { value: 'GAS', label: SENSOR_TYPE_LABELS.GAS, icon: 'flame-outline' },
  { value: 'SOUND', label: SENSOR_TYPE_LABELS.SOUND, icon: 'volume-medium-outline' },
];

export default function EditSensorScreen() {
  const router = useRouter();
  const { id, sensorId } = useLocalSearchParams<{ id: string; sensorId: string }>();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [type, setType] = useState<SensorType>('MOTION');
  const [hardwareId, setHardwareId] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || !sensorId) return;

    const fetchSensor = async () => {
      try {
        const sensor = await houseService.getSensor(id, sensorId);
        setName(sensor.name);
        setType(sensor.type);
        setHardwareId(sensor.hardwareId);
        setLocation(sensor.location || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar sensor');
      } finally {
        setLoading(false);
      }
    };

    fetchSensor();
  }, [id, sensorId]);

  const handleSave = async () => {
    if (!name.trim() || !type || !hardwareId.trim()) {
      setError('Por favor completa los campos requeridos');
      return;
    }

    setError('');
    setSaving(true);

    try {
      await houseService.updateSensor(id!, sensorId!, {
        name: name.trim(),
        type,
        hardwareId: hardwareId.trim(),
        location: location.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar sensor');
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
        <Appbar.Content title="Editar Sensor" />
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

          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Ionicons name="information-circle-outline" size={16} color="#666" />
                <Text variant="labelSmall" style={styles.cardTitle}>
                  Información del sensor
                </Text>
              </View>

              <TextInput
                label="Nombre"
                value={name}
                onChangeText={setName}
                mode="outlined"
                disabled={saving}
                style={styles.input}
              />

              <TextInput
                label="Hardware ID"
                value={hardwareId}
                onChangeText={setHardwareId}
                mode="outlined"
                disabled
                style={styles.input}
              />

              <TextInput
                label="Ubicación (opcional)"
                value={location}
                onChangeText={setLocation}
                mode="outlined"
                disabled={saving}
                style={styles.input}
              />
            </Card.Content>
          </Card>


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
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardTitle: {
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCell: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  typeCellContent: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  typeCellLabel: {
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  button: {
    minWidth: 100,
  },
});
