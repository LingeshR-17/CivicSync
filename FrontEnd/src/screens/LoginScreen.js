import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/env';
import { civicTheme } from '../styles/civicTheme';

const BACKEND_URL = API_ENDPOINTS.auth;

export default function LoginScreen({ onNavigateToRegister, loginUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 🚨 Specific Input & Server Error States
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const notifyUser = (title, msg) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleStandardLogin = async () => {
    setErrorMessage('');
    setEmailError(false);
    setPasswordError(false);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError(true);
      setErrorMessage('Please enter your email address.');
      notifyUser('Missing Email', 'Please enter your email address to sign in.');
      return;
    }
    if (!password) {
      setPasswordError(true);
      setErrorMessage('Please enter your password.');
      notifyUser('Missing Password', 'Please enter your password to sign in.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/login`, {
        email: trimmedEmail.toLowerCase(),
        password: password,
      });

      if (res.data && res.data.error) {
        const err = res.data.error;
        if (err.toLowerCase().includes('user not found')) {
          setEmailError(true);
          const msg = 'No citizen account found with this email. Please check your spelling or register a new profile.';
          setErrorMessage(msg);
          notifyUser('Account Not Found', msg);
        } else if (err.toLowerCase().includes('invalid credentials')) {
          setPasswordError(true);
          const msg = 'Incorrect password. Please verify your credentials and try again.';
          setErrorMessage(msg);
          notifyUser('Wrong Password', msg);
        } else {
          setErrorMessage(err);
          notifyUser('Authentication Error', err);
        }
      } else if (res.data && res.data.userId && loginUser) {
        loginUser(res.data);
      } else {
        const fallbackMsg = 'Login failed. Please verify your credentials.';
        setErrorMessage(fallbackMsg);
        notifyUser('Login Failed', fallbackMsg);
      }
    } catch (err) {
      console.error('Axios Catch Debug Log:', err);
      let errMsg = 'Could not reach the server. Please check your backend connection.';
      if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      }
      setErrorMessage(errMsg);
      notifyUser('Authentication Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={civicTheme.colors.gradients.officialNavy} style={styles.container}>
      <View style={{ paddingHorizontal: 24, flex: 1, justifyContent: 'center' }}>
        <Text style={styles.title}>CIVICSYNC CITIZEN PORTAL</Text>
        <Text style={styles.subtitle}>Enter credentials to access municipal infrastructure dashboard</Text>

        <View style={styles.formCard}>
          {/* In-App Visible Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <Text style={[styles.inputLabel, emailError && { color: '#ef4444' }]}>
            Email Address {emailError && '— Account Not Found'}
          </Text>
          <TextInput
            style={[styles.textInput, emailError && styles.textInputError]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(false);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="citizen@domain.com"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password Input */}
          <Text style={[styles.inputLabel, passwordError && { color: '#ef4444' }]}>
            Password {passwordError && '— Incorrect Password'}
          </Text>
          <TextInput
            style={[styles.textInput, passwordError && styles.textInputError]}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(false);
              if (errorMessage) setErrorMessage('');
            }}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#64748b"
          />

          <TouchableOpacity
            style={styles.primarySubmitButton}
            onPress={handleStandardLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onNavigateToRegister} style={{ marginTop: 16 }}>
          <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 13 }}>
            New Citizen?{' '}
            <Text style={{ color: civicTheme.colors.civicBlueLight, fontWeight: '700' }}>
              Register Profile Here
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d19' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', letterSpacing: 0.8 },
  subtitle: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  formCard: {
    backgroundColor: 'rgba(17, 34, 64, 0.85)',
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    ...civicTheme.shadows.card,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  inputLabel: {
    color: civicTheme.colors.civicBlueLight,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(10, 25, 47, 0.8)',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    fontSize: 14,
    marginBottom: 16,
  },
  textInputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  primarySubmitButton: {
    backgroundColor: civicTheme.colors.civicBlue,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    ...civicTheme.shadows.subtle,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});