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
  Card,
  IconButton,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import houseService from '@/services/houseService';
import {
  SensorNotificationRule,
  SensorNotificationRuleInput,
  SensorType,
} from '@/services/types';
import { Picker } from '@react-native-picker/picker';

const VALUE_LABELS: Partial<Record<SensorType, Record<string, string>>> = {
  MAGNETIC: { 1: 'ABIERTA', 0: 'CERRADA' },
  GAS: { 1: 'FUGA DETECTADA', 0: 'SIN FUGA' },
  SOUND: { 1: 'SONIDO DETECTADO', 0: 'SILENCIOSO' },
  MOTION: { 1: 'MOVIMIENTO DETECTADO', 0: 'SIN MOVIMIENTO' },
};

const getStateOptions = (sensorType: SensorType | '') => {
  const labels = sensorType ? VALUE_LABELS[sensorType] || {} : {};
  return Object.keys(labels)
    .map((value) => ({ value, label: labels[value] }))
    .sort((a, b) => Number(b.value) - Number(a.value));
};

const hasStateOptions = (sensorType: SensorType | '') => getStateOptions(sensorType).length > 0;

type RuleDraft = {
  uiId: string;
  id?: string;
  threshold: string;
  durationHours: string;
  durationMinutes: string;
  durationSeconds: string;
  timeFrom: string;
  timeTo: string;
};

let nextUiId = 0;
const newUiId = () => `tmp-${++nextUiId}`;

const toDisplayTime = (value: string | null): string =>
  value ? value.slice(0, 5) : '';

const toApiTime = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
};

const ruleFromBackend = (rule: SensorNotificationRule): RuleDraft => ({
  uiId: newUiId(),
  id: rule.id,
  threshold: rule.threshold != null ? String(rule.threshold) : '',
  durationHours:
    rule.durationSeconds != null ? String(Math.floor(rule.durationSeconds / 3600)) : '',
  durationMinutes:
    rule.durationSeconds != null ? String(Math.floor((rule.durationSeconds % 3600) / 60)) : '',
  durationSeconds:
    rule.durationSeconds != null ? String(rule.durationSeconds % 60) : '',
  timeFrom: toDisplayTime(rule.timeFrom),
  timeTo: toDisplayTime(rule.timeTo),
});

const emptyRule = (): RuleDraft => ({
  uiId: newUiId(),
  threshold: '',
  durationHours: '',
  durationMinutes: '',
  durationSeconds: '',
  timeFrom: '',
  timeTo: '',
});

const hasSustainedDuration = (rule: RuleDraft): boolean =>
  rule.durationHours.trim() !== '' ||
  rule.durationMinutes.trim() !== '' ||
  rule.durationSeconds.trim() !== '';

export default function SensorConfigurationScreen() {
  const router = useRouter();
  const { id, sensorId } = useLocalSearchParams<{ id: string; sensorId: string }>();
  const theme = useTheme();

  const [sensorName, setSensorName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [rules, setRules] = useState<RuleDraft[]>([]);
    const [sensorType, setSensorType] = useState<SensorType | ''>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !sensorId) return;
    houseService
      .getSensor(id, sensorId)
      .then((sensor) => {
        setSensorName(sensor.name);
        setSensorType(sensor.type);
        const prefs = sensor.notificationPreferences;
        if (prefs) {
          setEnabled(prefs.enabled);
          setRules(prefs.rules.map(ruleFromBackend));
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Error al cargar datos'),
      )
      .finally(() => setLoading(false));
  }, [id, sensorId]);

  const updateRule = (uiId: string, patch: Partial<RuleDraft>) => {
    setRules((prev) => prev.map((r) => (r.uiId === uiId ? { ...r, ...patch } : r)));
  };

  const addRule = () => {
    setRules((prev) => [...prev, emptyRule()]);
  };

  const removeRule = (uiId: string) => {
    setRules((prev) => prev.filter((r) => r.uiId !== uiId));
  };

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
    if (!id || !sensorId) return;

    const payloadRules: SensorNotificationRuleInput[] = [];

    for (const [index, rule] of rules.entries()) {
      const from = rule.timeFrom.trim();
      const to = rule.timeTo.trim();
      if ((from && !to) || (!from && to)) {
        setError(
          `Regla ${index + 1}: completá ambos horarios o dejalos vacíos.`,
        );
        return;
      }

      const thresholdRaw = rule.threshold.trim();
      const threshold = thresholdRaw !== '' ? Number(thresholdRaw) : null;
      if (thresholdRaw !== '' && !Number.isFinite(threshold)) {
        setError(`Regla ${index + 1}: el umbral debe ser un número válido.`);
        return;
      }

      const hRaw = (rule.durationHours || '').trim();
      const mRaw = (rule.durationMinutes || '').trim();
      const sRaw = (rule.durationSeconds || '').trim();

      const hasDuration = hRaw !== '' || mRaw !== '' || sRaw !== '';
      let durationSeconds: number | null = null;
      if (hasDuration) {
        const h = hRaw !== '' ? parseInt(hRaw, 10) : 0;
        const m = mRaw !== '' ? parseInt(mRaw, 10) : 0;
        const s = sRaw !== '' ? parseInt(sRaw, 10) : 0;
        if (!Number.isInteger(h) || h < 0 || !Number.isInteger(m) || m < 0 || m >= 60 || !Number.isInteger(s) || s < 0 || s >= 60) {
          setError(`Regla ${index + 1}: la duración debe ser valores enteros válidos (m/s 0-59).`);
          return;
        }
        durationSeconds = h * 3600 + m * 60 + s;
        if (durationSeconds <= 0) {
          setError(`Regla ${index + 1}: la duración debe ser mayor a 0.`);
          return;
        }
      }

      if (durationSeconds !== null && threshold === null) {
        setError(`Regla ${index + 1}: si definís una duración, el umbral es obligatorio.`);
        return;
      }

      if (threshold === null && durationSeconds === null && !from && !to) {
        setError(`Regla ${index + 1}: definí al menos un umbral o una ventana horaria.`);
        return;
      }

      const payloadRule: SensorNotificationRuleInput = {};
      if (threshold !== null) payloadRule.threshold = threshold;
      if (durationSeconds !== null) payloadRule.durationSeconds = durationSeconds;
      const apiFrom = from ? toApiTime(from) : null;
      const apiTo = to ? toApiTime(to) : null;
      if (apiFrom) payloadRule.timeFrom = apiFrom;
      if (apiTo) payloadRule.timeTo = apiTo;

      payloadRules.push(payloadRule);
    }

    setSaving(true);
    setError('');

    try {
      const result = await houseService.updateSensorNotificationPreferences(
        id,
        sensorId,
        { enabled, rules: payloadRules },
      );
      setRules(result.rules.map(ruleFromBackend));
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
      <Appbar.Header>
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

          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Ionicons name="notifications-outline" size={16} color="#666" />
                <Text variant="labelSmall" style={styles.cardTitle}>
                  Notificaciones
                </Text>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Text variant="bodyLarge">Notificaciones activas</Text>
                  <Text variant="bodySmall" style={styles.hint}>
                    Recibí alertas de este sensor en tu dispositivo.
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={setEnabled}
                  color={theme.colors.primary}
                />
              </View>
            </Card.Content>
          </Card>

          <View style={styles.rulesHeader}>
            <View style={styles.cardHeader}>
              <Ionicons name="options-outline" size={16} color="#666" />
              <Text variant="labelSmall" style={styles.cardTitle}>
                Reglas de alerta
              </Text>
            </View>
            <Button
              mode="text"
              compact
              icon="plus"
              onPress={addRule}
              disabled={saving}
            >
              Agregar
            </Button>
          </View>

          {rules.length === 0 ? (
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="bodySmall" style={[styles.hint, styles.emptyText]}>
                  No hay reglas configuradas. Agregá una para definir cuándo
                  notificar.
                </Text>
              </Card.Content>
            </Card>
          ) : (
            rules.map((rule, index) => (
              <Card key={rule.uiId} style={styles.card}>
                <Card.Content>
                  <View style={styles.ruleTitleRow}>
                    <View style={styles.ruleTitleGroup}>
                      <Text variant="titleSmall" style={styles.ruleTitle}>
                        Regla {index + 1}
                      </Text>
                      <View
                        style={[
                          styles.ruleBadge,
                          hasSustainedDuration(rule)
                            ? styles.ruleBadgeSustained
                            : styles.ruleBadgeImmediate,
                        ]}
                      >
                        <Ionicons
                          name={hasSustainedDuration(rule) ? 'time-outline' : 'flash-outline'}
                          size={12}
                          color={hasSustainedDuration(rule) ? '#d97706' : '#1D9E75'}
                        />
                        <Text
                          style={[
                            styles.ruleBadgeText,
                            hasSustainedDuration(rule) && styles.ruleBadgeTextSustained,
                          ]}
                        >
                          {hasSustainedDuration(rule) ? 'Sostenida' : 'Inmediata'}
                        </Text>
                      </View>
                    </View>
                    <IconButton
                      icon="close"
                      size={18}
                      onPress={() => removeRule(rule.uiId)}
                      disabled={saving}
                    />
                  </View>

                  <Text variant="labelSmall" style={styles.fieldLabel}>
                    Estado
                  </Text>
                  {hasStateOptions(sensorType) ? (
                    <View style={styles.selectContainer}>
                      <Picker
                        selectedValue={rule.threshold}
                        onValueChange={(value) =>
                          updateRule(rule.uiId, { threshold: String(value) })
                        }
                        enabled={!saving}
                        style={styles.select}
                      >
                        {getStateOptions(sensorType).map((option) => (
                          <Picker.Item
                            key={option.value}
                            label={option.label}
                            value={option.value}
                          />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <TextInput
                      mode="outlined"
                      placeholder="Sin estado"
                      keyboardType="numeric"
                      value={rule.threshold}
                      onChangeText={(v) => updateRule(rule.uiId, { threshold: v })}
                      disabled={saving}
                      style={styles.input}
                      dense
                    />
                  )}

                  <Text variant="labelSmall" style={styles.fieldLabel}>
                    Duración (h/m/s) (opcional)
                  </Text>
                  <View style={styles.durationRow}>
                    <TextInput
                      mode="outlined"
                      placeholder="hh"
                      keyboardType="numeric"
                      value={rule.durationHours}
                      onChangeText={(v) => updateRule(rule.uiId, { durationHours: v })}
                      disabled={saving}
                      style={[styles.input, styles.durationInput]}
                      dense
                    />
                    <Text style={styles.timeSep}>:</Text>
                    <TextInput
                      mode="outlined"
                      placeholder="mm"
                      keyboardType="numeric"
                      value={rule.durationMinutes}
                      onChangeText={(v) => updateRule(rule.uiId, { durationMinutes: v })}
                      disabled={saving}
                      style={[styles.input, styles.durationInput]}
                      dense
                    />
                    <Text style={styles.timeSep}>:</Text>
                    <TextInput
                      mode="outlined"
                      placeholder="ss"
                      keyboardType="numeric"
                      value={rule.durationSeconds}
                      onChangeText={(v) => updateRule(rule.uiId, { durationSeconds: v })}
                      disabled={saving}
                      style={[styles.input, styles.durationInput]}
                      dense
                    />
                  </View>

                  <Text variant="labelSmall" style={styles.fieldLabel}>
                    Ventana horaria (opcional)
                  </Text>
                  {Platform.OS === 'android' ? (
                    <View style={styles.timeRow}>
                      <Button
                        mode="outlined"
                        icon="clock-outline"
                        onPress={() =>
                          openTimePicker(rule.timeFrom, (v) =>
                            updateRule(rule.uiId, { timeFrom: v }),
                          )
                        }
                        disabled={saving}
                        style={styles.timeButton}
                      >
                        {rule.timeFrom || 'Desde'}
                      </Button>
                      <Text style={styles.timeSep}>hasta</Text>
                      <Button
                        mode="outlined"
                        icon="clock-outline"
                        onPress={() =>
                          openTimePicker(rule.timeTo, (v) =>
                            updateRule(rule.uiId, { timeTo: v }),
                          )
                        }
                        disabled={saving}
                        style={styles.timeButton}
                      >
                        {rule.timeTo || 'Hasta'}
                      </Button>
                    </View>
                  ) : (
                    <View style={styles.timeRow}>
                      <TextInput
                        mode="outlined"
                        placeholder="HH:MM"
                        value={rule.timeFrom}
                        onChangeText={(v) =>
                          updateRule(rule.uiId, { timeFrom: v })
                        }
                        disabled={saving}
                        style={styles.timeInput}
                        maxLength={5}
                        dense
                      />
                      <Text style={styles.timeSep}>hasta</Text>
                      <TextInput
                        mode="outlined"
                        placeholder="HH:MM"
                        value={rule.timeTo}
                        onChangeText={(v) =>
                          updateRule(rule.uiId, { timeTo: v })
                        }
                        disabled={saving}
                        style={styles.timeInput}
                        maxLength={5}
                        dense
                      />
                    </View>
                  )}

                  {rule.timeFrom || rule.timeTo ? (
                    <Button
                      mode="text"
                      compact
                      icon="close"
                      onPress={() =>
                        updateRule(rule.uiId, { timeFrom: '', timeTo: '' })
                      }
                      disabled={saving}
                      style={styles.clearTimeButton}
                    >
                      Limpiar horario
                    </Button>
                  ) : null}
                </Card.Content>
              </Card>
            ))
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
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hint: {
    opacity: 0.6,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  toggleLabel: {
    flex: 1,
    marginRight: 12,
  },
  ruleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ruleTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  ruleTitle: {
    fontWeight: '600',
  },
  ruleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ruleBadgeImmediate: {
    backgroundColor: '#e8f8f2',
  },
  ruleBadgeSustained: {
    backgroundColor: '#fff3e0',
  },
  ruleBadgeText: {
    color: '#1D9E75',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ruleBadgeTextSustained: {
    color: '#d97706',
  },
  fieldLabel: {
    opacity: 0.6,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    marginBottom: 4,
  },
  selectContainer: {
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#9FE1CB',
    borderRadius: 8,
    minHeight: 56,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  select: {
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  durationInput: {
    flex: 1,
    minWidth: 0,
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
  clearTimeButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
