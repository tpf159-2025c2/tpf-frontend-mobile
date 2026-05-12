import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, Appbar, useTheme, Card, TextInput, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import houseService from '@/services/houseService';

const STEPS = [
  {
    number: 1,
    text: 'Conectar el hub con el cable USB.',
  },
  {
    number: 2,
    text: 'Conectarse al WiFi "ESP32-Hub" desde un dispositivo (movil o computadora).',
  },
  {
    number: 3,
    text: 'Al abrir el navegador, sera redirigido a la pagina de Sign In del hub.',
  },
  {
    number: 4,
    text: 'Ir a la seccion WiFi para configurarlo.',
  },
  {
    number: 5,
    text: 'Seleccionar la red WiFi a la que se quiere conectar el hub e ingresar la contraseña.',
  },
  {
    number: 6,
    text: 'Ingresar los datos de la cuenta y presionar Guardar:',
    substeps: ['Email', 'Contraseña'],
  },
  {
    number: 7,
    text: 'Si los datos son correctos, la nueva casa/hub deberia aparecer automaticamente en la app.',
    warning: 'No aparece la casa? Repetir el proceso desde el paso 2.',
  },
];

export default function NewHouseScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [showManualForm, setShowManualForm] = useState(false);
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
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Como agregar una Casa?
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Sigue estos pasos para configurar tu hub y registrar una nueva casa
            </Text>
          </View>

          <View style={styles.stepsContainer}>
            {STEPS.map((step, index) => (
              <View key={step.number} style={styles.stepWrapper}>
                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.verticalLine,
                      { backgroundColor: theme.colors.secondary },
                    ]}
                  />
                )}

                <Card
                  style={[
                    styles.stepCard,
                    { borderColor: theme.colors.secondary },
                  ]}
                  mode="outlined"
                >
                  <View style={styles.stepContent}>
                    <View
                      style={[
                        styles.stepNumber,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <Text style={styles.stepNumberText}>{step.number}</Text>
                    </View>

                    <View style={styles.stepTextContainer}>
                      <Text variant="bodyMedium" style={styles.stepText}>
                        {step.text}
                      </Text>

                      {step.substeps && (
                        <View style={styles.substepsContainer}>
                          {step.substeps.map((substep, idx) => (
                            <View key={idx} style={styles.substepItem}>
                              <Text style={[styles.bullet, { color: theme.colors.primary }]}>
                                •
                              </Text>
                              <Text
                                variant="bodyMedium"
                                style={[styles.substepText, { fontWeight: '600' }]}
                              >
                                {substep}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {step.warning && (
                        <View style={styles.warningContainer}>
                          <Text
                            variant="bodySmall"
                            style={[styles.warningText, { color: '#856404' }]}
                          >
                            {step.warning}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Card>
              </View>
            ))}
          </View>

          {/* Manual form section */}
          <View style={styles.manualSection}>
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
              <Text variant="bodyMedium" style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>
                o
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.outline }]} />
            </View>

            {!showManualForm ? (
              <Button
                mode="outlined"
                onPress={() => setShowManualForm(true)}
                icon="pencil"
                style={styles.manualButton}
              >
                Agregar manualmente
              </Button>
            ) : (
              <View style={styles.formContainer}>
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

                <View style={styles.formActions}>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setShowManualForm(false);
                      setName('');
                      setAddress('');
                      setError('');
                    }}
                    disabled={loading}
                    style={styles.formButton}
                  >
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleCreate}
                    loading={loading}
                    disabled={loading}
                    style={styles.formButton}
                  >
                    Guardar
                  </Button>
                </View>
              </View>
            )}
          </View>

          {!showManualForm && (
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                style={styles.button}
              >
                Volver
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.8,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  verticalLine: {
    position: 'absolute',
    left: 20,
    top: 56,
    bottom: -16,
    width: 2,
    zIndex: 0,
  },
  stepCard: {
    borderWidth: 1,
    zIndex: 1,
  },
  stepContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    lineHeight: 22,
  },
  substepsContainer: {
    marginTop: 12,
    marginLeft: 8,
  },
  substepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bullet: {
    marginRight: 8,
    fontSize: 16,
  },
  substepText: {
    fontSize: 14,
  },
  warningContainer: {
    marginTop: 12,
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#EF9F27',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  warningText: {
    fontWeight: '500',
  },
  manualSection: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontWeight: '500',
  },
  manualButton: {
    alignSelf: 'center',
  },
  formContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
  },
  error: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    minWidth: 100,
  },
  actions: {
    alignItems: 'center',
  },
  button: {
    minWidth: 120,
  },
});
