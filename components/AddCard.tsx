import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  height?: number;
  width?: number;
}

export default function AddCard({ icon, label, onPress, height = 180, width = 100 }: AddCardProps) {
  return (
    <Pressable style={[styles.card, { height, width }]} onPress={onPress}>
      <Ionicons name={icon} size={36} color="#1D9E75" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D9E75',
    textAlign: 'center',
  },
});
