import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, HelperText, Appbar, useTheme, Text } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import houseService from '@/services/houseService';
import { MemberRole, MEMBER_ROLE_LABELS } from '@/services/types';

const MEMBER_ROLES: { value: MemberRole; label: string }[] = [
  { value: 'OWNER', label: MEMBER_ROLE_LABELS.OWNER },
  { value: 'ADMIN', label: MEMBER_ROLE_LABELS.ADMIN },
  { value: 'MEMBER', label: MEMBER_ROLE_LABELS.MEMBER },
];

export default function EditMemberScreen() {
  const router = useRouter();
  const { id, memberId } = useLocalSearchParams<{ id: string; memberId: string }>();
  const theme = useTheme();

  const [role, setRole] = useState<MemberRole>('MEMBER');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError('');
    setSaving(true);

    try {
      await houseService.updateMember(id!, memberId!, { role });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar miembro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Editar Rol" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error ? (
          <HelperText type="error" visible={true} style={styles.error}>
            {error}
          </HelperText>
        ) : null}

        <Text variant="bodyMedium" style={styles.label}>
          Seleccionar nuevo rol
        </Text>

        <View style={[styles.pickerContainer, { borderColor: theme.colors.outline }]}>
          <Picker
            selectedValue={role}
            onValueChange={(value) => setRole(value)}
            enabled={!saving}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  error: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
    opacity: 0.7,
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
