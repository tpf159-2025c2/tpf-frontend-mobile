import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import useAuthStore from '@/hooks/useAuthStore';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const register = useAuthStore((state) => state.register);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register({ name: name.trim(), email: email.trim(), password });
      router.replace('/(protected)/(tabs)/houses');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text variant="headlineMedium" style={styles.title}>
            Crear cuenta
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Registrate para comenzar
          </Text>

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
            autoCapitalize="words"
            autoComplete="name"
            disabled={loading}
            style={styles.input}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            disabled={loading}
            style={styles.input}
          />

          <TextInput
            label="Contrasena"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            disabled={loading}
            style={styles.input}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? 'eye' : 'eye-off'}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text variant="bodySmall" style={styles.separatorText}>
              Ya tenes cuenta?
            </Text>
            <View style={styles.separatorLine} />
          </View>

          <Button
            mode="outlined"
            onPress={() => router.push('/login')}
            disabled={loading}
            style={styles.button}
          >
            Iniciar sesion
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  error: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  separatorText: {
    marginHorizontal: 16,
    opacity: 0.7,
  },
});
