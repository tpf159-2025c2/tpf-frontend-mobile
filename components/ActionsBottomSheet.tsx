import { ComponentProps } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Modal, Portal, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export type SheetAction = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  onDismiss: () => void;
  actions: SheetAction[];
};

export default function ActionsBottomSheet({ visible, onDismiss, actions }: Props) {
  const theme = useTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalWrapper}
      >
        <Pressable style={styles.flexFill} onPress={onDismiss} />
        <View
          style={[styles.sheet, { backgroundColor: theme.colors.background }]}
        >
          <View style={styles.handle} />
          {actions.map((action) => {
            const color = action.destructive ? theme.colors.error : theme.colors.onSurface;
            return (
              <TouchableRipple
                key={action.label}
                onPress={() => {
                  onDismiss();
                  requestAnimationFrame(action.onPress);
                }}
                style={styles.actionRow}
              >
                <View style={styles.actionContent}>
                  <Ionicons name={action.icon} size={22} color={color} />
                  <Text variant="bodyLarge" style={[styles.actionLabel, { color }]}>
                    {action.label}
                  </Text>
                </View>
              </TouchableRipple>
            );
          })}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    margin: 0,
    justifyContent: 'flex-end',
  },
  flexFill: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d0d0d0',
    marginBottom: 8,
  },
  actionRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionLabel: {
    fontWeight: '500',
  },
});
