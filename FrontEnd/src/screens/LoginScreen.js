import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const BACKEND_URL = "http://192.168.0.4:8080/api/auth";

export default function LoginScreen({ onNavigateToRegister, loginUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStandardLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Missing Inputs", "Please enter your authenticated email and password.");
    }
    
    setLoading(true);
    try {
      // 📡 1. Send Login Payload to Backend Gateway
      const res = await axios.post(`${BACKEND_URL}/login`, { 
        email: email.trim().toLowerCase(), 
        password: password 
      });

      // 🔬 2. Log exact response to the Metro terminal console to trace bugs
      console.log("Backend Login Response Payload:", res.data);

      if (res.data && (res.data.error || res.data.message === "Invalid credentials")) {
        Alert.alert("Authentication Failed", res.data.error || res.data.message || "Invalid credentials.");
      } else if (loginUser) {
        // 🚀 3. Hand over session context token to App.js navigation tracker
        loginUser(res.data); 
      }
    } catch (err) {
      // 🛠️ Diagnostic Breakdown: Track exactly what broke the request
      console.error("Axios Catch Debug Log:", err);
      
      if (err.response) {
        // The server answered back, but gave an error status code (like 400, 401, 403, 500)
        Alert.alert(
          "Server Rejected Request", 
          err.response.data?.error || err.response.data?.message || `Error status code: ${err.response.status}`
        );
      } else if (err.request) {
        // The network request left the app but never got a response back
        Alert.alert("Server Connectivity Error", "Could not physically reach the authentication gateway service. Verify your backend server layout is up and running.");
      } else {
        // A native runtime exception occurred setting up the network call
        Alert.alert("Application Error", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#103e4b', '#07161b']} style={styles.container}>
      <View style={{ paddingHorizontal: 24, flex: 1, justifyContent: 'center' }}>
        
        <Text style={styles.title}>CIVIC SYNC LOGIN</Text>
        <Text style={styles.subtitle}>Enter credentials to access municipal infrastructure dashboard</Text>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput 
            style={styles.textInput} 
            value={email} 
            onChangeText={setEmail} 
            placeholder="citizen@domain.com" 
            placeholderTextColor="#475569" 
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput 
            style={styles.textInput} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            placeholder="••••••••" 
            placeholderTextColor="#475569" 
          />

          <TouchableOpacity style={styles.primarySubmitButton} onPress={handleStandardLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onNavigateToRegister} style={{ marginTop: 8 }}>
          <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: 13 }}>
            New to CivicSync? <Text style={{ color: '#a5f3fc', fontWeight: '600' }}>Register Profile Here</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07161b' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5 },
  subtitle: { color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase' },
  textInput: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 14, marginBottom: 16 },
  primarySubmitButton: { backgroundColor: '#0e7490', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});