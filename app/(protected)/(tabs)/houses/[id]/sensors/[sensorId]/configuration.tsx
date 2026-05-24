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
} from '@/services/types';

type RuleDraft = {
  uiId: string;
  id?: string;
  threshold: string;
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
  durationSeconds: rule.durationSeconds != null ? String(rule.durationSeconds) : '',
  timeFrom: toDisplayTime(rule.timeFrom),
  timeTo: toDisplayTime(rule.timeTo),
});

const emptyRule = (): RuleDraft => ({
  uiId: newUiId(),
  threshold: '',
  durationSeconds: '',
  timeFrom: '',
  timeTo: '',
});

export default function SensorConfigurationScreen() {
  const router = useRouter();
  const { id, sensorId } = useLocalSearchParams<{ id: string; sensorId: string }>();
  const theme = useTheme();

  const [sensorName, setSensorName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [rules, setRules] = useState<RuleDraft[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !sensorId) return;

    houseService
      .getSensor(id, sensorId)
      .then((sensor) => {
        setSensorName(sensor.name);
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

      const durationRaw = rule.durationSeconds.trim();
      const durationSeconds = durationRaw !== '' ? parseInt(durationRaw, 10) : null;
      if (durationRaw !== '' && (!Number.isInteger(durationSeconds) || durationSeconds! <= 0)) {
        setError(`Regla ${index + 1}: la duración debe ser un entero mayor a 0.`);
        return;
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
      if (from) payloadRule.timeFrom = toApiTime(from);
      if (to) payloadRule.timeTo = toApiTime(to);

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
                    <Text variant="titleSmall" style={styles.ruleTitle}>
                      Regla {index + 1}
                    </Text>
                    <IconButton
                      icon="close"
                      size={18}
                      onPress={() => removeRule(rule.uiId)}
                      disabled={saving}
                    />
                  </View>

                  <Text variant="labelSmall" style={styles.fieldLabel}>
                    Umbral (opcional)
                  </Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Sin umbral"
                    keyboardType="numeric"
                    value={rule.threshold}
                    onChangeText={(v) => updateRule(rule.uiId, { threshold: v })}
                    disabled={saving}
                    style={styles.input}
                    dense
                  />

                  <Text variant="labelSmall" style={styles.fieldLabel}>
                    Duración mínima en segundos (opcional)
                  </Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Sin duración mínima"
                    keyboardType="numeric"
                    value={rule.durationSeconds}
                    onChangeText={(v) =>
                      updateRule(rule.uiId, { durationSeconds: v })
                    }
                    disabled={saving}
                    style={styles.input}
                    dense
                  />

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
  ruleTitle: {
    fontWeight: '600',
  },
  fieldLabel: {
    opacity: 0.6,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
