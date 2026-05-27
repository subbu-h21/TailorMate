import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useHistoryStore } from '../../stores/historyStore';
import { PatternRecord } from '../../types';

export default function HistoryScreen() {
  const router = useRouter();
  const { records, deleteRecord } = useHistoryStore();

  const renderCard = ({ item: r }: { item: PatternRecord }) => (
    <Pressable
      className="bg-gray-900 rounded-2xl p-4"
      onPress={() =>
        router.push(
          `/canvas/${r.templateId}?m=${encodeURIComponent(JSON.stringify(r.measurements))}`
        )
      }
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">{r.templateName}</Text>
          <Text className="text-gray-400 text-sm mt-0.5">{r.customerName}</Text>
        </View>
        <Text className="text-gray-600 text-xs">
          {new Date(r.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View className="flex-row justify-between items-center mt-3">
        <Text className="text-gray-600 text-xs">
          {Object.keys(r.measurements).length} measurements
        </Text>
        <Pressable
          onPress={() =>
            Alert.alert('Delete Pattern', 'Remove this pattern from history?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => deleteRecord(r.id),
              },
            ])
          }
        >
          <Text className="text-red-400 text-xs">Delete</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text className="text-white text-2xl font-bold px-4 pt-4 pb-3">History</Text>

      {records.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-base">No patterns yet</Text>
          <Text className="text-gray-600 text-sm mt-1">
            Generate a pattern to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(r) => r.id}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        />
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
