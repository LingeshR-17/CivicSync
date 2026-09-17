import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';

// ==========================================
// 1. EDIT PROFILE SCREEN COMPONENT
// ==========================================
export function EditProfileScreen({ onBack, userEmail }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('12');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCachedData = async () => {
      const cachedName = await AsyncStorage.getItem('USER_NAME') || (userEmail ? userEmail.split('@')[0] : '');
      const cachedPhone = await AsyncStorage.getItem('USER_PHONE') || '';
      const cachedWard = await AsyncStorage.getItem('USER_WARD') || '12';
      setName(cachedName);
      setPhone(cachedPhone);
      setWard(cachedWard);
    };
    loadCachedData();
  }, [userEmail]);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Error", "Name field cannot be empty.");
    setSaving(true);
    try {
      // Save locally for instant real-time front-end synchronization
      await AsyncStorage.setItem('USER_NAME', name);
      await AsyncStorage.setItem('USER_PHONE', phone);
      await AsyncStorage.setItem('USER_WARD', ward);

      // OPTIONAL: Call your Spring Boot endpoint here
      // await axios.put(`${BASE_URL}/users/profile`, { name, phone, ward, email: userEmail });

      Alert.alert("Success", "Profile metrics synchronized successfully.", [{ text: "OK", onPress: onBack }]);
    } catch (err) {
      Alert.alert("Error", "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: '#07161b', padding: 20 }]}>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
        <Ionicons name="arrow-back" size={20} color="#a5f3fc" />
        <Text style={{ color: '#a5f3fc', fontSize: 16, marginLeft: 8, fontWeight: '600' }}>Back to Account</Text>
      </TouchableOpacity>

      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 20 }}>Edit Profile</Text>

      <View style={{ gap: 16 }}>
        <View>
          <Text style={{ color: '#94a3b8', marginBottom: 6, fontSize: 13 }}>Full Name</Text>
          <TextInput value={name} onChangeText={setName} style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} placeholder="Enter your name" placeholderTextColor="#475569" />
        </View>

        <View>
          <Text style={{ color: '#94a3b8', marginBottom: 6, fontSize: 13 }}>Phone Number</Text>
          <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} placeholder="+91 XXXXX XXXXX" placeholderTextColor="#475569" />
        </View>

        <View>
          <Text style={{ color: '#94a3b8', marginBottom: 6, fontSize: 13 }}>Assigned Municipal Ward</Text>
          <TextInput value={ward} onChangeText={setWard} keyboardType="numeric" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
        </View>

        <TouchableOpacity onPress={handleSave} style={{ backgroundColor: '#0e7490', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 12 }} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ==========================================
// 2. PRIVACY & SECURITY SCREEN COMPONENT
// ==========================================
export function PrivacySecurityScreen({ onBack }) {
  const [locationGranted, setLocationGranted] = useState(false);
  const [checkingPerms, setCheckingPerms] = useState(true);

  useEffect(() => {
    checkCurrentPermissions();
  }, []);

  const checkCurrentPermissions = async () => {
    try {
      const { granted } = await Location.getForegroundPermissionsAsync();
      setLocationGranted(granted);
    } catch (e) {
      console.log(e);
    } finally {
      setCheckingPerms(false);
    }
  };

  const toggleLocationPermission = async () => {
    if (locationGranted) {
      Alert.alert("Permission Management", "To disable location tracking entirely, please adjust CivicSync access privileges directly inside your system device settings.");
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocationGranted(true);
      Alert.alert("Authorized", "Precise hardware GPS tracking enabled for grievance pinning.");
    } else {
      Alert.alert("Denied", "Location tracking permissions rejected.");
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: '#07161b', padding: 20 }]}>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
        <Ionicons name="arrow-back" size={20} color="#a5f3fc" />
        <Text style={{ color: '#a5f3fc', fontSize: 16, marginLeft: 8, fontWeight: '600' }}>Back to Account</Text>
      </TouchableOpacity>

      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 20 }}>Privacy & Security</Text>

      <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderHighlight: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 16, gap: 20 }}>
        
        {/* Hardware Location Access Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>GPS Location Services</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Required to automatically attach geographic positioning data to civic grievance forms.</Text>
          </View>
          {checkingPerms ? (
            <ActivityIndicator color="#a5f3fc" />
          ) : (
            <Switch
              trackColor={{ false: '#1e293b', true: '#0e7490' }}
              thumbColor={locationGranted ? '#a5f3fc' : '#64748b'}
              value={locationGranted}
              onValueChange={toggleLocationPermission}
            />
          )}
        </View>

        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />

        {/* Local Cryptographic Storage Data Reset */}
        <View>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Local Cache Registry</Text>
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2, marginBottom: 12 }}>Purge encrypted cache snapshots and local storage databases synced on this machine.</Text>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert("Clear Diagnostics Data?", "This actions purges local configurations without changing database records.", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear Cache", style: "destructive", onPress: async () => { await AsyncStorage.clear(); Alert.alert("Purged", "Local device cache cleared."); } }
              ]);
            }}
            style={{ backgroundColor: 'rgba(229, 62, 62, 0.15)', borderWidth: 1, borderColor: '#e53e3e', padding: 12, borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ color: '#e53e3e', fontWeight: '600', fontSize: 14 }}>Wipe Storage Cache</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}