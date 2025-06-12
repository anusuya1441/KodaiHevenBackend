import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from './App';

// Type Definitions
type TableRow = {
  sno?: number;
  code: string;
  desc: string;
  qty?: number;
  price?: number;
  total: number;
  remarks: string;
  id?: number;
  Cancel_Status?: string;
};

type MenuItem = {
  name: string;
  price: number;
  id: number;
};

type MenuScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Menu'>;
type MenuScreenRouteProp = RouteProp<RootStackParamList, 'Menu'>;

const MenuScreen = () => {
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const navigation = useNavigation<MenuScreenNavigationProp>();
  const route = useRoute<MenuScreenRouteProp>();
  const { width } = useWindowDimensions();

  const { selectedItem, selectedRadio, selectedRoom } = route.params;

  useEffect(() => {
    fetch(`http://172.20.10.2:3001/api/menu_items/${encodeURIComponent(selectedItem)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const items: MenuItem[] = data.data.map((item: any) => ({
            name: item.Menu_Name,
            price: item.Menu_price,
            id: item.Menu_ID,
          }));
          setMenuItems(items);
        }
      })
      .catch(err => console.error('Error fetching menu items:', err));
  }, [selectedItem]);

  const updateField = (index: number, key: keyof TableRow, value: string) => {
    setTableData(prevData => {
      const newData = [...prevData];
      const row = newData[index];
      if (!row) return prevData;

      if (key === 'qty' || key === 'price' || key === 'sno') {
        const numericValue = value === '' ? 0 : parseFloat(value);
        (row as any)[key] = numericValue;
      } else if (key === 'total') {
        // skip: total is computed
      } else {
        (row as any)[key] = value;
      }

      const qty = row.qty ?? 0;
      const price = row.price ?? 0;
      row.total = qty * price;

      return newData;
    });
  };

  const deleteRow = (index: number) => {
    const item = tableData[index];
    if (item.id != null) {
      Alert.alert('Cancel Record', 'Do you want to cancel this item?', [
        { text: 'No' },
        {
          text: 'Yes',
          onPress: () => {
            fetch('http://172.20.10.2:3001/api/cancel_kot', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: item.id }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  Alert.alert('Record cancelled');
                  const newData = [...tableData];
                  newData[index] = {
                    ...newData[index],
                    Cancel_Status: 'no',
                  };
                  setTableData(newData);
                } else {
                  Alert.alert('Cancel failed');
                }
              })
              .catch(err => {
                console.error('Error cancelling:', err);
                Alert.alert('Cancel error');
              });
          },
        },
      ]);
    } else {
      const newData = [...tableData];
      newData.splice(index, 1);
      setTableData(newData);
    }
  };

  const saveData = () => {
    const payload = {
      menuSection: selectedItem,
      radioOption: selectedRadio,
      selectedRoom,
      items: tableData.map(({ sno, ...rest }) => rest),
    };

    fetch('http://172.20.10.2:3001/api/save_menu_items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(response => {
        if (response.success) {
          Alert.alert('Saved successfully!');
        } else {
          Alert.alert('Failed to save');
        }
      })
      .catch(err => {
        console.error('Error saving data:', err);
        Alert.alert('Error saving data');
      });
  };

 const printData = () => {
  fetch('http://172.20.10.2:3001/api/print_kot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedRoom,
      selectedItem,
      selectedRadio,
      items: tableData.filter(item => item.Cancel_Status !== 'no'), // exclude cancelled items
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        navigation.navigate('KOTPrintScreen', {
          kotNo: data.kotNo,
          items: data.items,
        });
      } else {
        Alert.alert('Print Failed', data.message);
      }
    })
    .catch(err => {
      console.error('Print KOT error:', err);
      Alert.alert('Error printing data');
    });
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu: {selectedItem}</Text>

      <View style={styles.splitContainer}>
        {/* Left: Menu Items */}
        <ScrollView style={styles.leftColumn}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                const newRow: TableRow = {
                  sno: tableData.length + 1,
                  code: item.id.toString(),
                  desc: item.name,
                  qty: 1,
                  price: item.price,
                  total: item.price,
                  remarks: '',
                };
                setTableData([...tableData, newRow]);
              }}
            >
              <Text style={styles.menuItemText}>{item.name} - ₹{item.price}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Right: Table Grid */}
        <ScrollView horizontal style={styles.rightColumn}>
          <View>
            <View style={styles.headerRow}>
              {['S.No', 'Code', 'Description', 'Qty', 'Price', 'Total', 'Remarks', 'Delete'].map((col, i) => (
                <Text key={i} style={styles.headerCell}>{col}</Text>
              ))}
            </View>

            {tableData.map((item, index) => (
              <View style={styles.dataRow} key={index}>
                {(['sno', 'code', 'desc', 'qty', 'price'] as (keyof TableRow)[]).map((key, i) => (
                  <TextInput
                    key={i}
                    style={styles.input}
                    value={item[key]?.toString() ?? ''}
                    keyboardType={['qty', 'price', 'sno'].includes(key) ? 'numeric' : 'default'}
                    onChangeText={(text) => updateField(index, key, text)}
                  />
                ))}
                <Text style={styles.cell}>{item.total.toString()}</Text>
                <TextInput
                  style={styles.input}
                  value={item.remarks}
                  onChangeText={(text) => updateField(index, 'remarks', text)}
                />
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRow(index)}>
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={saveData}>
          <Text style={styles.bottomButtonText}>📀 Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printButton} onPress={printData}>
          <Text style={styles.bottomButtonText}>🖨️ Print</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#840214', marginBottom: 10 },
  splitContainer: { flexDirection: 'row', flex: 1 },
  leftColumn: {
    width: '45%',
    borderRightWidth: 1,
    borderColor: '#ccc',
    paddingRight: 5,
  },
  rightColumn: {
    width: '55%',
    paddingLeft: 5,
  },
  menuItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  menuItemText: {
    fontSize: 16,
    color: '#840214',
  },
  headerRow: { flexDirection: 'row', backgroundColor: '#ddd' },
  headerCell: {
    width: 70,
    minWidth: 70,
    padding: 5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    width: 70,
    minWidth: 70,
    padding: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    textAlign: 'center',
  },
  cell: {
    width: 70,
    minWidth: 70,
    padding: 5,
    textAlign: 'center',
  },
  deleteButton: { width: 40, alignItems: 'center' },
  deleteText: { fontSize: 18, color: '#c00' },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#840214',
    padding: 10,
    borderRadius: 5,
  },
  printButton: {
    backgroundColor: '#840214',
    padding: 10,
    borderRadius: 5,
  },
  bottomButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default MenuScreen;
