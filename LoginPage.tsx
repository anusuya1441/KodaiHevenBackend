import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from './App';
import LinearGradient from 'react-native-linear-gradient';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const isDesktop = Platform.OS === 'windows' || width >= 1024;

  const handleLogin = async () => {
    try {
      const response = await fetch('http://172.20.10.2:3001/api/login', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username, password })
                    });

      const data = await response.json();

      if (response.ok && data.success) {
        navigation.replace('Home');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid username or password');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong. Check your network or server.');
    }
  };

  return (
    <LinearGradient
      colors={['#ceac56', '#f5e6c4', '#ceac56']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.container, { padding: isDesktop ? 40 : isTablet ? 30 : 20 }]}>
            <Text
              style={[
                styles.title,
                { fontSize: isDesktop ? 32 : isTablet ? 28 : 24 },
              ]}
            >
              Login
            </Text>
            <TextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              style={[
                styles.input,
                { height: isDesktop ? 56 : 48 },
              ]}
            />
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={[
                styles.input,
                { height: isDesktop ? 56 : 48 },
              ]}
            />
            <TouchableOpacity
              style={[
                styles.button,
                {
                  paddingVertical: isDesktop ? 16 : 12,
                  maxWidth: 500,
                  alignSelf: 'center',
                },
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  gradient: {
    flex: 1,
  },
  container: {
    justifyContent: 'center',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#4e342e',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    width: '100%',
  },
  button: {
    backgroundColor: '#840214',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
