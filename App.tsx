import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginPage from './LoginPage';
import HomeScreen from './HomeScreen';
import MenuScreen from './MenuScreen';
import KOTListScreen from './Kot_list';
import KOTDetailsScreen from './Kot_Details';
import KOTPrintScreen from './PrintPreviewScreen';

export type KOTItem = {
  id: number;
  kotNumber: number;
  date: string;
  roomNo: string;
  details: string;
};

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Menu: {
    selectedItem: string;
    selectedRadio: string;
    selectedRoom: string;
  };
  KOTList: undefined;
  KOTDetails: { kotData: KOTItem };
  PrintPreviewScreen: undefined;
  KOTPrintScreen: {
    kotNo: number;
    items: any[];
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{ title: 'Menu' }}
   
        
        />
        <Stack.Screen
          name="KOTList"
          component={KOTListScreen}
          options={{ title: 'KOT List' }}
        />
        <Stack.Screen
          name="KOTDetails"
          component={KOTDetailsScreen}
          options={{ title: 'KOT Details' }}
        />
        <Stack.Screen
          name="KOTPrintScreen"
          component={KOTPrintScreen}
          options={{ title: 'Print Preview' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
