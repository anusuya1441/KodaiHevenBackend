import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import axios from 'axios';

type KOTItem = {
  ID: number;
  KOT_No: number;
  CreatedAt: string;
  Menu_Section: string;
  Radio_Option: string;
  Room_No: string;
  ItemCode: string;
  Description: string;
  Qty: number;
  Price: number;
  Total: number;
  Remarks: string;
  Cancel_Status: string;
};

const PrintPreviewScreen = () => {
  const [kotItems, setKOTItems] = useState<KOTItem[]>([]);
  const [kotNo, setKOTNo] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Automatically use correct IP for emulator or real device
  const getServerURL = () => {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001/api/print_kot'; // Android emulator
    } else {
      return 'http://192.168.1.7:3001/api/print_kot'; // Physical device (adjust if IP changes)
    }
  };

  useEffect(() => {
    const fetchPrintData = async () => {
      try {
        const response = await axios.post(getServerURL());
        console.log('KOT response:', response.data);

        if (response.data.success) {
          setKOTItems(response.data.items);
          setKOTNo(response.data.kotNo);
        } else {
          Alert.alert('Error', 'No KOT items available.');
        }
      } catch (error: any) {
        console.error('Axios error:', error.message);
        Alert.alert('Connection Error', error.message || 'Unable to connect to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchPrintData();
  }, []);

  const renderItem = ({ item }: { item: KOTItem }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.Description}</Text>
      <Text style={styles.itemText}>Qty: {item.Qty}</Text>
      <Text style={styles.itemText}>Price: ₹{item.Price}</Text>
      <Text style={styles.itemText}>Total: ₹{item.Total}</Text>
      <Text style={styles.itemText}>Remarks: {item.Remarks || 'N/A'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading KOT preview...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>KOT Print Preview</Text>

      {kotItems.length > 0 ? (
        <>
          <Text style={styles.label}>KOT No: <Text style={styles.value}>{kotNo}</Text></Text>
          <Text style={styles.label}>Menu Section: <Text style={styles.value}>{kotItems[0].Menu_Section}</Text></Text>
          <Text style={styles.label}>Option: <Text style={styles.value}>{kotItems[0].Radio_Option}</Text></Text>
          <Text style={styles.label}>Room No: <Text style={styles.value}>{kotItems[0].Room_No}</Text></Text>

          <FlatList
            data={kotItems}
            keyExtractor={(item) => item.ID.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />
        </>
      ) : (
        <Text style={styles.noItems}>No items to display</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  value: {
    fontWeight: 'normal',
    color: '#555',
  },
  list: {
    marginTop: 20,
  },
  itemContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  itemText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noItems: {
    fontSize: 16,
    color: 'gray',
    marginTop: 20,
    textAlign: 'center',
  },
});

export default PrintPreviewScreen;
