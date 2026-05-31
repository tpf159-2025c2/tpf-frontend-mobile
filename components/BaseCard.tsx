import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';

interface BaseCardProps {
  onPress: () => void;
  bannerColor: string;
  bannerHeight?: number;
  bannerContent: React.ReactNode;
  bodyContent: React.ReactNode;
  footerContent: React.ReactNode;
  style?: ViewStyle;
  cardOpacity?: number;
}

export default function BaseCard({
  onPress,
  bannerColor,
  bannerHeight = 70,
  bannerContent,
  bodyContent,
  footerContent,
  style,
  cardOpacity = 1,
}: BaseCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        style,
        { opacity: pressed ? 0.85 : cardOpacity },
      ]}
      onPress={onPress}
    >
      <View style={[styles.banner, { height: bannerHeight, backgroundColor: bannerColor }]}>
        {bannerContent}
      </View>
      <View style={styles.body}>
        {bodyContent}
      </View>
      <View style={styles.footer}>
        {footerContent}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  banner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 14,
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 'auto',
  },
});
