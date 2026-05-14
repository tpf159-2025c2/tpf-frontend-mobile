import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text as RNText } from 'react-native';
import {
  Text,
  FAB,
  Searchbar,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import BaseCard from '@/components/BaseCard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import houseService from '@/services/houseService';
import { House } from '@/services/types';

export default function HousesListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<House[] | null>(null);
  const [searchError, setSearchError] = useState('');

  const fetchHouses = useCallback(async () => {
    try {
      const data = await houseService.getHouses();
      setHouses(data);
    } catch (error) {
      console.error('Error al obtener casas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHouses();
  }, [fetchHouses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchResults(null);
    setSearchQuery('');
    setSearchError('');
    fetchHouses();
  }, [fetchHouses]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchError('');
      return;
    }

    try {
      const results = await houseService.searchHouse(searchQuery.trim());
      setSearchResults(Array.isArray(results) ? results : [results]);
      setSearchError('');
    } catch (error) {
      setSearchResults([]);
      setSearchError(error instanceof Error ? error.message : 'Error al buscar');
    }
  };

  const displayedHouses = searchResults !== null ? searchResults : houses;

  const renderHouseCard = ({ item }: { item: House }) => (
    <BaseCard
      style={styles.card}
      onPress={() => router.push(`/(protected)/(tabs)/houses/${item.id}`)}
      bannerColor="#1D9E75"
      bannerHeight={70}
      bannerContent={<Ionicons name="home" size={40} color="rgba(255,255,255,0.9)" />}
      bodyContent={
        <>
          <RNText style={styles.cardTitle}>{item.name}</RNText>
          <View style={styles.cardAddressRow}>
            <Ionicons name="git-network-outline" size={12} color="#999" />
            <RNText style={styles.cardAddress}>{item.address}</RNText>
          </View>
        </>
      }
      footerContent={
        <>
          <RNText style={styles.cardFooterText}>Ver sensores</RNText>
          <Ionicons name="chevron-forward" size={12} color="#1D9E75" style={{ marginLeft: 'auto' }} />
        </>
      }
    />
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Mis Casas
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Gestiona tus sistemas de supervision
        </Text>
      </View>

      <Searchbar
        placeholder="Buscar por Direccion MAC..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchbar}
      />

      {searchError ? (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {searchError}
        </Text>
      ) : null}

      <FlatList
        data={displayedHouses}
        renderItem={renderHouseCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchResults !== null
                ? 'No se encontraron resultados'
                : 'No tienes casas registradas'}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/(protected)/(tabs)/houses/new')}
        color={theme.colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  searchbar: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  errorText: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },
  cardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardAddress: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace',
  },
  cardFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D9E75',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
