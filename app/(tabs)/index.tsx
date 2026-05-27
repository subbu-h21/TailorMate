import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTemplateStore } from '../../stores/templateStore';
import { TemplateMeta } from '../../types';

export default function TemplatesScreen() {
  const router = useRouter();
  const { catalog, isLoading, error, fetchCatalog } = useTemplateStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (catalog.length === 0) {
      fetchCatalog();
    }
  }, [catalog.length, fetchCatalog]);

  const categories = catalog.reduce<string[]>((acc, item) => {
    if (!acc.includes(item.category)) acc.push(item.category);
    return acc;
  }, []);

  // Derive effective category — auto-select first once catalog loads
  const effectiveCategory = selectedCategory ?? catalog[0]?.category ?? null;

  const filtered = effectiveCategory
    ? catalog.filter((item) => item.category === effectiveCategory)
    : catalog;

  const renderCard = ({ item }: { item: TemplateMeta }) => (
    <Pressable
      className="bg-gray-900 rounded-2xl p-4 flex-1"
      onPress={() => router.push(`/template/${item.id}`)}
    >
      <Text className="text-white font-semibold text-base mb-1">{item.variant}</Text>
      <Text className="text-gray-400 text-sm mb-3" numberOfLines={2}>
        {item.description}
      </Text>
      <Text className="text-blue-400 text-xs">
        {item.measurements.length} measurements
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
<Text className="text-white text-2xl font-bold px-4 pt-4 pb-2">
        Templates
      </Text>

      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3b82f6" />
        </View>
      )}

      {!isLoading && error !== null && (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-red-400 text-base text-center">{error}</Text>
          <Pressable
            className="mt-3 bg-blue-500 rounded-xl px-6 py-3"
            onPress={fetchCatalog}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && error === null && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8, alignItems: 'center' }}
          >
            {categories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={
                  effectiveCategory === cat
                    ? 'bg-blue-500 rounded-full px-4 py-1.5 mr-2'
                    : 'bg-gray-800 rounded-full px-4 py-1.5 mr-2'
                }
              >
                <Text
                  className={
                    effectiveCategory === cat
                      ? 'text-white text-sm font-medium'
                      : 'text-gray-400 text-sm'
                  }
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {filtered.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500 text-base">No templates found</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={renderCard}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ padding: 16, gap: 12 }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});
