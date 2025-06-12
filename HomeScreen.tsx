import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';

type MenuSection = {
  Menu_section: string;
};

type RadioOption = {
  TYPE: string;
};

const HomeScreen = () => {
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [radioOptions, setRadioOptions] = useState<RadioOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, radioRes] = await Promise.all([
          axios.get('http://192.168.1.7:3001/api/menu_items'),
          axios.get('http://192.168.1.7:3001/api/radio-options'),
        ]);

        setMenuSections(menuRes.data);
        setRadioOptions(radioRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to fetch data from server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Menu Sections</Text>
      <FlatList
        data={menuSections}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>{item.Menu_section}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No menu sections found.</Text>}
      />

      <Text style={styles.heading}>Radio Options</Text>
      <FlatList
        data={radioOptions}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>{item.TYPE}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No radio options found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: 'gray',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default HomeScreen;
