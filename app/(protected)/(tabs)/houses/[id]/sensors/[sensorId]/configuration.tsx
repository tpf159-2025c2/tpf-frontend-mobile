import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Appbar,
  Button,
  Switch,
  TextInput,
  HelperText,
  ActivityIndicator,
  useTheme,
  Divider,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import houseService from '@/services/houseService';
import userService from '@/services/userService';
import useAuthStore from '@/hooks/useAuthStore';

export default function SensorConfigurationScreen() {
  const router = useRouter();
  const { id, sensorId } = useLocalSearchParams<{ id: string; sensorId: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const [sensorName, setSensorName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !id || !sensorId) return;

    Promise.all([
      houseService.getSensor(id, sensorId),
      userService.getSensorPreferences(user.id, id),
    ])
      .then(([sensorData, { preferences }]) => {
        setSensorName(sensorData.name);
        const match = preferences.find((p) => p.sensorId === sensorId);
        if (match) {
          setEnabled(match.enabled);
          setThreshold(match.threshold != null ? String(match.threshold) : '');
          setTimeFrom(match.timeFrom ? match.timeFrom.slice(0, 5) : '');
          setTimeTo(match.timeTo ? match.timeTo.slice(0, 5) : '');
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar datos'))
      .finally(() => setLoading(false));
  }, [user, id, sensorId]);

  const openTimePicker = (
    current: string,
    onSelect: (time: string) => void,
  ) => {
    const [hours, minutes] = current ? current.split(':').map(Number) : [0, 0];
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);

    DateTimePickerAndroid.open({
      value: date,
      mode: 'time',
      is24Hour: true,
      onChange: (_event, selected) => {
        if (!selected) return;
        const h = selected.getHours().toString().padStart(2, '0');
        const m = selected.getMinutes().toString().padStart(2, '0');
        onSelect(`${h}:${m}`);
      },
    });
  };

  const handleSave = async () => {
    if (!user || !sensorId) return;

    const from = timeFrom.trim() || null;
    const to = timeTo.trim() || null;

    if ((from && !to) || (!from && to)) {
      setError('Debés completar ambos campos de horario o dejarlos vacíos.');
      return;
    }

    const parsedThreshold =
      threshold.trim() !== '' ? parseFloat(threshold) : null;

    if (threshold.trim() !== '' && isNaN(parsedThreshold!)) {
      setError('El umbral debe ser un número válido.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await userService.updateSensorPreference(user.id, sensorId, {
        enabled,
        threshold: parsedThreshold,
        timeFrom: from,
        timeTo: to,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar preferencias');
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
      <Appbar.Header style={{ marginTop: insets.top }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Mis alertas" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {sensorName ? (
            <Text variant="bodyMedium" style={styles.sensorName}>
              {sensorName}
            </Text>
          ) : null}

          {error ? (
            <HelperText type="error" visible style={styles.errorText}>
              {error}
            </HelperText>
          ) : null}

          {/* Enabled toggle */}
          <View style={styles.row}>
            <Text variant="bodyLarge" style={styles.rowLabel}>
              Notificaciones activas
            </Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              color={theme.colors.primary}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Threshold */}
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Umbral de alerta{' '}
            <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <Text variant="bodySmall" style={styles.sectionHint}>
            Solo se notifica si el valor del sensor supera este número.
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Sin umbral"
            keyboardType="numeric"
            value={threshold}
            onChangeText={setThreshold}
            disabled={saving}
            style={styles.input}
          />

          <Divider style={styles.divider} />

          {/* Time window */}
          <Text variant="labelLarge" style={styles.sectionLabel}>
            Ventana horaria{' '}
            <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <Text variant="bodySmall" style={styles.sectionHint}>
            Solo se notifica si la lectura ocurre dentro de este horario.
          </Text>

          {Platform.OS === 'android' ? (
            <View style={styles.timeRow}>
              <Button
                mode="outlined"
                onPress={() => openTimePicker(timeFrom, setTimeFrom)}
                disabled={saving}
                style={styles.timeButton}
              >
                {timeFrom || 'Desde'}
              </Button>
              <Text style={styles.timeSep}>hasta</Text>
              <Button
                mode="outlined"
                onPress={() => openTimePicker(timeTo, setTimeTo)}
                disabled={saving}
                style={styles.timeButton}
              >
                {timeTo || 'Hasta'}
              </Button>
              {(timeFrom || timeTo) ? (
                <Button
                  mode="text"
                  compact
                  onPress={() => { setTimeFrom(''); setTimeTo(''); }}
                  disabled={saving}
                >
                  Limpiar
                </Button>
              ) : null}
            </View>
          ) : (
            <View style={styles.timeRow}>
              <TextInput
                mode="outlined"
                placeholder="HH:MM"
                value={timeFrom}
                onChangeText={setTimeFrom}
                disabled={saving}
                style={styles.timeInput}
                maxLength={5}
              />
              <Text style={styles.timeSep}>hasta</Text>
              <TextInput
                mode="outlined"
                placeholder="HH:MM"
                value={timeTo}
                onChangeText={setTimeTo}
                disabled={saving}
                style={styles.timeInput}
                maxLength={5}
              />
            </View>
          )}

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              disabled={saving}
              style={styles.actionButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              icon="bell"
              style={styles.actionButton}
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
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  flex: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sensorName: {
    opacity: 0.6,
    marginBottom: 16,
  },
  errorText: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: {
    flex: 1,
    marginRight: 12,
  },
  divider: {
    marginVertical: 20,
  },
  sectionLabel: {
    marginBottom: 4,
  },
  optional: {
    fontWeight: '400',
    opacity: 0.5,
  },
  sectionHint: {
    opacity: 0.6,
    marginBottom: 12,
  },
  input: {
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timeButton: {
    flex: 1,
  },
  timeInput: {
    flex: 1,
  },
  timeSep: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  actionButton: {
    flex: 1,
  },
});
