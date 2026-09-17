import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { styles, colors } from '../styles/globalStyles';
import { fetchGrievances } from '../api/api';

// 🎯 The backend's OfficerGrievanceServiceImpl only ever sets these two strings
// when a ticket is genuinely closed out — "Solved"/"SOLVED" was never real.
const TRULY_RESOLVED_STATUSES = ['RESOLVED', 'CLOSED'];

export default function AccountScreen({ onLogout, userEmail, userName, currentUserId, userCity, userDistrict, userWard, ...props }) {
  const [loading, setLoading] = useState(true);
  const [totalReported, setTotalReported] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(true);

  // 🎯 Handles fallback screen routing functions using your custom navigation setup
  const navigateTo = (screenName) => {
    if (props.navigation?.navigate) {
      props.navigation.navigate(screenName);
    } else if (props.navigate) {
      props.navigate(screenName);
    } else {
      Alert.alert("Navigation Notice", `${screenName} submenu view is compiling.`);
    }
  };

  useEffect(() => {
    const loadRealTimeDashboardMetrics = async () => {
      try {
        setLoading(true);

        if (!currentUserId) {
          // Not logged in / id not available yet — show honest zeros, not fake numbers.
          setTotalReported(0);
          setResolvedCount(0);
          return;
        }

        // 🎯 FIX #4: Fetch all grievances and filter by the REAL citizenId the backend
        // now returns on every record (it used to be missing entirely, so the old
        // userEmail/reportedBy filter could never match anything).
        const allGrievances = await fetchGrievances(currentUserId);

        if (allGrievances && Array.isArray(allGrievances)) {
          const userTickets = allGrievances.filter((t) => t.citizenId === currentUserId);
          const resolved = userTickets.filter((t) =>
            TRULY_RESOLVED_STATUSES.includes((t.status || '').toUpperCase())
          );

          // No more fake fallback numbers — these are the real counts, even if they're 0.
          setTotalReported(userTickets.length);
          setResolvedCount(resolved.length);
        }
      } catch (err) {
        console.error("Failed fetching live profile analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRealTimeDashboardMetrics();
  }, [currentUserId]);

  // Handle destructive logout action cleanly with confirmation verification
  const triggerLogoutSequence = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to exit your CivicSync session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              if (onLogout) {
                onLogout();
              } else if (props.navigate) {
                props.navigate('login');
              }
            } catch (error) {
              console.error("Session cleanup failure:", error);
            }
          }
        }
      ]
    );
  };

  // 🎯 FIX #4: Use the real registered name from sign-up instead of guessing it
  // from the email's local-part. Falls back gracefully if name is somehow missing.
  const displayName = userName || (userEmail ? userEmail.split('@')[0] : 'Citizen User');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: '#07161b' }]}>
      {/* Screen Header Frame */}
      <View style={styles.screenHeaderContainer || { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16, paddingHorizontal: 4 }}>
        <Text style={[styles.centeredScreenTitleText || styles.centeredScreenTitle, { textTransform: 'uppercase', color: '#fff', fontSize: 18, fontWeight: '700' }]}>USER ACCOUNT</Text>
        <TouchableOpacity style={styles.headerProfileCircle} onPress={() => Alert.alert("Profile Picture", "Upload module opens in production build.")}>
          <Ionicons name="person" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Dynamic Profile Glassmorphism Card */}
      <View style={styles.profileGlassBanner || { marginBottom: 20, borderRadius: 16, overflow: 'hidden' }}>
        <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']} style={styles.profileBannerGradient || { flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <View style={styles.profileAvatarFrame || { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }}>
            <FontAwesome5 name="user-shield" size={20} color="#a5f3fc" />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[styles.profileNameText, { textTransform: 'capitalize', color: '#fff', fontSize: 17, fontWeight: '600' }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.profileSubEmail || styles.ticketDateStamp, { color: '#94a3b8', fontSize: 13, marginTop: 2 }]} numberOfLines={1}>
              {userEmail || 'citizen@civicsync.com'}
            </Text>
            {userDistrict ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Ionicons name="location-sharp" size={12} color="#a5f3fc" />
                <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '600', marginLeft: 4 }} numberOfLines={1}>
                  {[userCity, userDistrict].filter(Boolean).join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </View>

      {userWard ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
          <Ionicons name="map" size={16} color="#94a3b8" />
          <Text style={{ color: '#cbd5e1', fontSize: 12, marginLeft: 8 }}>
            Municipal Ward / Area: <Text style={{ fontWeight: '700', color: '#fff' }}>{userWard}</Text>
          </Text>
        </View>
      ) : null}

      {/* Real-time Telemetry Dashboard Badges */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
          <FontAwesome5 name="clipboard-list" size={16} color="#fbbf24" />
          {loading ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 4 }} />
          ) : (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginVertical: 2 }}>{totalReported}</Text>
          )}
          <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '500' }}>Filed Grievances</Text>
        </View>

        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
          <FontAwesome5 name="check-double" size={16} color="#4ade80" />
          {loading ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 4 }} />
          ) : (
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginVertical: 2 }}>{resolvedCount}</Text>
          )}
          <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '500' }}>Tickets Resolved</Text>
        </View>
      </View>

      {/* Core Action Menu Structure Layout */}
      <View style={styles.settingsMenuBox || { gap: 4 }}>

        {/* Edit Profile Entry Button */}
        <TouchableOpacity style={styles.menuRowItem} onPress={() => navigateTo('edit-profile')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="pencil" size={18} color="#94a3b8" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemLabelText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        {/* Real-Time Notification Preference Toggle Row */}
        <View style={[styles.menuRowItem, { justifyContent: 'space-between' }]}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="notifications" size={18} color="#94a3b8" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemLabelText}>Live Status Push Alerts</Text>
          </View>
          <Switch
            trackColor={{ false: '#1e293b', true: '#0e7490' }}
            thumbColor={pushEnabled ? '#a5f3fc' : '#64748b'}
            value={pushEnabled}
            onValueChange={(val) => setPushEnabled(val)}
          />
        </View>

        {/* Privacy & Security Access Button */}
        <TouchableOpacity style={styles.menuRowItem} onPress={() => navigateTo('privacy-security')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="lock-closed" size={18} color="#94a3b8" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemLabelText}>Privacy & Security</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        {/* Submit App Feedback Button */}
        <TouchableOpacity style={styles.menuRowItem} onPress={() => navigateTo('app-feedback')}>
          <View style={styles.menuRowLeft}>
            <Ionicons name="chatbox-ellipses" size={18} color="#94a3b8" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemLabelText}>Submit App Feedback</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        {/* Destructive Logout Interface Row Trigger */}
        <TouchableOpacity style={styles.menuRowItem} onPress={triggerLogoutSequence}>
          <View style={styles.menuRowLeft}>
            <MaterialIcons name="logout" size={18} color="#e53e3e" style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemLabelText, { color: '#e53e3e', fontWeight: '600' }]}>Logout Session</Text>
          </View>
        </TouchableOpacity>

      </View>

      {/* Production Metadata Label Block */}
      <View style={{ marginTop: 40, alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: '#475569', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 }}>
          CIVICSYNC MOBILE SYSTEM • VERSION 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
