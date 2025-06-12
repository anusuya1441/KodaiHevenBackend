import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  KOTList: undefined;
  KOTDetails: { kotData: { kotNumber: number } };
};

type KOTDetailsRouteProp = RouteProp<RootStackParamList, 'KOTDetails'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'KOTDetails'>;

type KOTItem = {
  id: number;
  kotNumber: number;
  date: string;
  roomNo: string;
  description: string;
  qty: number;
  price: number;
  total: number;
  remarks: string;
  cancelStatus: string;
};

const windowWidth = Dimensions.get('window').width;

const Kot_Details = () => {
  const route = useRoute<KOTDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { kotData } = route.params;

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<KOTItem[]>([]);
  const [isCancelling, setIsCancelling] = useState<number | null>(null);

  useEffect(() => {
    fetchKOTDetails();
  }, []);

  const fetchKOTDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://172.20.10.2:3001/api/kot-list-details/${kotData.kotNumber}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        const mappedItems: KOTItem[] = json.data.map((item: any) => ({
          id: item.id,
          kotNumber: item.KOT_No,
          date: item.CreatedAt,
          roomNo: item.Room_No,
          description: item.Description,
          qty: item.Qty,
          price: item.Price,
          total: item.Total,
          remarks: item.Remarks,
          cancelStatus: item.Cancel_Status,
        }));
        setDetails(mappedItems);
      } else {
        Alert.alert('No KOT details found');
        setDetails([]);
      }
    } catch (e) {
      Alert.alert('Network error while loading details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
  if (isCancelling !== null) return;
  setIsCancelling(id);
  try {
    const response = await fetch('http://172.20.10.2:3001/api/cancel-kot', {
      method: 'PUT',  // use PUT, not POST
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (result.success) {
      Alert.alert('Success', 'Item cancelled successfully');
      setDetails((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, Cancel_Status: 'Yes' } : item
        )
      );
    } else {
      Alert.alert('Error', result.message || 'Cancel failed');
    }
  } catch (e) {
    Alert.alert('Network error or server unavailable');
  } finally {
    setIsCancelling(null);
  }
};

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#840214" />
      </View>
    );
  }

  if (details.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No details found for this KOT.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>KOT Details (#{kotData.kotNumber})</Text>
      <FlatList
        data={details}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // <-- This makes the grid with 2 columns
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <Text style={styles.label}>Description: {item.description}</Text>
            <Text style={styles.label}>Qty: {item.qty}</Text>
            <Text style={styles.label}>Price: ₹{item.price}</Text>
            <Text style={styles.label}>Total: ₹{item.total}</Text>
            <Text style={styles.label}>Room No: {item.roomNo}</Text>
            <Text style={styles.label}>Remarks: {item.remarks || 'None'}</Text>
            <Text style={styles.label}>Cancel Status: {item.cancelStatus}</Text>
            <Button
              title={isCancelling === item.id ? 'Cancelling...' : 'Cancel Item'}
              onPress={() => handleCancel(item.id)}
              disabled={isCancelling !== null || item.cancelStatus === 'Yes'}
              color="#D32F2F"
            />
          </View>
        )}
        columnWrapperStyle={styles.row} // To space items horizontally
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E1', padding: 20 },
  heading: { fontSize: 22, fontWeight: 'bold', color: '#840214', marginBottom: 20, textAlign: 'center' },
  row: {
    justifyContent: 'space-between', // space between columns
    marginBottom: 15,
  },
  gridItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    flex: 1, // takes up equal width
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontSize: 14, color: '#333', marginBottom: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default Kot_Details;
