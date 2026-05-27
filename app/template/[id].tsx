import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTemplateStore } from '../../stores/templateStore';
import { useCustomerStore } from '../../stores/customerStore';

export default function MeasurementInputScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { catalog } = useTemplateStore();
  const { customers } = useCustomerStore();

  const meta = catalog.find((t) => t.id === id);

  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    const filled: Record<string, string> = {};
    for (const key of Object.keys(customer.measurements)) {
      filled[key] = String(customer.measurements[key]);
    }
    setMeasurements(filled);
    setSelectedCustomerName(customer.name);
    setCustomerPickerOpen(false);
  };

  const handleEnterManually = () => {
    setMeasurements({});
    setSelectedCustomerName(null);
    setCustomerPickerOpen(false);
  };

  const handleGenerate = () => {
    const fields = meta?.measurements ?? [];
    const numeric: Record<string, number> = {};

    for (const field of fields) {
      const val = parseFloat(measurements[field] ?? '');
      if (isNaN(val)) {
        Alert.alert('Missing measurements', 'Please fill in all fields.');
        return;
      }
      numeric[field] = val;
    }

    const url =
      `/canvas/${id}?m=${encodeURIComponent(JSON.stringify(numeric))}` +
      (selectedCustomerName
        ? `&cn=${encodeURIComponent(selectedCustomerName)}`
        : '');
    router.push(url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center px-4 pt-2 pb-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-white text-2xl mr-3">←</Text>
        </Pressable>
        <Text className="text-white text-xl font-bold">
          {meta?.variant ?? 'Measurements'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {/* Customer selector */}
          <View className="bg-gray-900 rounded-2xl p-4">
            <Text className="text-gray-400 text-xs mb-2 uppercase tracking-wider">
              Customer
            </Text>
            <Pressable
              className="flex-row items-center justify-between"
              onPress={() => setCustomerPickerOpen((v) => !v)}
            >
              <Text className="text-white text-base">
                {selectedCustomerName ?? 'Enter manually'}
              </Text>
              <Text className="text-gray-400">▾</Text>
            </Pressable>

            {customerPickerOpen && (
              <View className="mt-2">
                <Pressable onPress={handleEnterManually}>
                  <Text className="text-white py-2 border-b border-gray-800">
                    Enter manually
                  </Text>
                </Pressable>
                {customers.map((customer) => (
                  <Pressable
                    key={customer.id}
                    onPress={() => handleSelectCustomer(customer.id)}
                  >
                    <Text className="text-white py-2 border-b border-gray-800">
                      {customer.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Measurement fields */}
          {(meta?.measurements ?? []).map((fieldName) => (
            <View key={fieldName} className="bg-gray-900 rounded-2xl p-4">
              <Text className="text-gray-400 text-xs mb-2 uppercase tracking-wider">
                {fieldName}
              </Text>
              <TextInput
                value={measurements[fieldName] ?? ''}
                onChangeText={(v) =>
                  setMeasurements((prev) => ({ ...prev, [fieldName]: v }))
                }
                keyboardType="decimal-pad"
                placeholder="cm"
                placeholderTextColor="#6b7280"
                className="text-white text-lg"
              />
            </View>
          ))}

          {/* Generate button */}
          <Pressable
            className="bg-blue-500 rounded-2xl p-4 items-center"
            onPress={handleGenerate}
          >
            <Text className="text-white font-bold text-lg">Generate Pattern</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});
