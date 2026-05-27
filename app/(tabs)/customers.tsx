import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import { Customer } from '../../types';

export default function CustomersScreen() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomerStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMeasurements, setFormMeasurements] = useState<{ key: string; value: string }[]>([]);

  function openAdd() {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormMeasurements([]);
    setModalVisible(true);
  }

  function openEdit(c: Customer) {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone ?? '');
    setFormMeasurements(
      Object.entries(c.measurements).map(([key, value]) => ({
        key,
        value: String(value),
      }))
    );
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormMeasurements([]);
  }

  function addMeasurementRow() {
    setFormMeasurements((prev) => [...prev, { key: '', value: '' }]);
  }

  function saveCus() {
    if (!formName.trim()) {
      Alert.alert('Name required', 'Please enter a customer name.');
      return;
    }
    const measurements: Record<string, number> = {};
    for (const row of formMeasurements) {
      if (row.key.trim()) {
        measurements[row.key.trim()] = parseFloat(row.value) || 0;
      }
    }
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        measurements,
      });
    } else {
      addCustomer({
        name: formName.trim(),
        phone: formPhone.trim() || undefined,
        measurements,
      });
    }
    closeModal();
  }

  const renderCard = ({ item: c }: { item: Customer }) => (
    <Pressable className="bg-gray-900 rounded-2xl p-4" onPress={() => openEdit(c)}>
      <View className="flex-row items-center">
        <Text className="text-white font-semibold text-base flex-1">{c.name}</Text>
        <Text className="text-gray-500 text-sm">
          {Object.keys(c.measurements).length} measurements
        </Text>
      </View>
      {c.phone ? (
        <Text className="text-gray-400 text-sm mt-1">{c.phone}</Text>
      ) : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <Text className="text-white text-2xl font-bold">Customers</Text>
        <Pressable
          className="bg-blue-500 rounded-full w-9 h-9 items-center justify-center"
          onPress={openAdd}
        >
          <Text className="text-white text-2xl leading-none">+</Text>
        </Pressable>
      </View>

      {customers.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-base">No customers yet</Text>
          <Text className="text-gray-600 text-sm mt-1">Tap + to add one</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(c) => c.id}
          renderItem={renderCard}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end">
          <View className="bg-gray-900 rounded-t-3xl px-4 pt-4 pb-8">
            <View className="flex-row items-center mb-4">
              <Text className="text-white text-lg font-bold flex-1">
                {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </Text>
              {editingCustomer && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      'Delete Customer',
                      `Delete ${editingCustomer.name}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            deleteCustomer(editingCustomer.id);
                            closeModal();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text className="text-red-400 text-sm mr-4">Delete</Text>
                </Pressable>
              )}
              <Pressable onPress={closeModal}>
                <Text className="text-gray-400 text-xl">✕</Text>
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                Name
              </Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder="Full name"
                placeholderTextColor="#6b7280"
                className="text-white text-base bg-gray-800 rounded-xl px-4 py-3 mt-1"
              />

              <Text className="text-gray-400 text-xs uppercase tracking-wider mb-1 mt-4">
                Phone (optional)
              </Text>
              <TextInput
                value={formPhone}
                onChangeText={setFormPhone}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor="#6b7280"
                className="text-white text-base bg-gray-800 rounded-xl px-4 py-3 mt-1"
              />

              <Text className="text-gray-400 text-xs uppercase tracking-wider mb-1 mt-4">
                Measurements
              </Text>
              {formMeasurements.map((row, i) => (
                <View key={i} className="flex-row gap-2 mt-2">
                  <TextInput
                    value={row.key}
                    onChangeText={(v) =>
                      setFormMeasurements((prev) =>
                        prev.map((r, idx) => (idx === i ? { ...r, key: v } : r))
                      )
                    }
                    placeholder="e.g. bust_round"
                    placeholderTextColor="#6b7280"
                    className="flex-1 text-white bg-gray-800 rounded-xl px-3 py-3"
                  />
                  <TextInput
                    value={row.value}
                    onChangeText={(v) =>
                      setFormMeasurements((prev) =>
                        prev.map((r, idx) => (idx === i ? { ...r, value: v } : r))
                      )
                    }
                    keyboardType="decimal-pad"
                    placeholder="cm"
                    placeholderTextColor="#6b7280"
                    className="w-24 text-white bg-gray-800 rounded-xl px-3 py-3"
                  />
                  <Pressable
                    onPress={() =>
                      setFormMeasurements((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="justify-center px-2"
                  >
                    <Text className="text-red-400">✕</Text>
                  </Pressable>
                </View>
              ))}

              <Pressable
                onPress={addMeasurementRow}
                className="mt-2 border border-gray-700 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-400 text-sm">+ Add measurement</Text>
              </Pressable>

              <Pressable
                onPress={saveCus}
                className="mt-4 bg-blue-500 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-bold text-base">Save</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});
