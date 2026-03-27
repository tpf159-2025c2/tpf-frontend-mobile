import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, HelperText, Appbar, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import houseService from '@/services/houseService';
import { MemberRole, MEMBER_ROLE_LABELS } from '@/services/types';

const MEMBER_ROLES: { value: MemberRole; label: string }[] = [
  { value: 'OWNER', label: MEMBER_ROLE_LABELS.OWNER },
  { value: 'ADMIN', label: MEMBER_ROLE_LABELS.ADMIN },
  { value: 'MEMBER', label: MEMBER_ROLE_LABELS.MEMBER },
];

export default function NewMemberScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa un email');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await houseService.createMember(id!, {
        email: email.trim(),
        role,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar miembro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ marginTop: insets.top }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Agregar Miembro" />
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
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="usuario@email.com"
            disabled={loading}
            style={styles.input}
          />

          <View style={[styles.pickerContainer, { borderColor: theme.colors.outline }]}>
            <Picker
              selectedValue={role}
              onValueChange={(value) => setRole(value)}
              enabled={!loading}
              style={styles.picker}
            >
              {MEMBER_ROLES.map((r) => (
                <Picker.Item key={r.value} label={r.label} value={r.value} />
              ))}
            </Picker>
          </View>

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
              Agregar
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
