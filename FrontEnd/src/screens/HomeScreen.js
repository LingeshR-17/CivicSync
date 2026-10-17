import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles/globalStyles";
import { fetchGrievances, getMediaUrl } from "../api/api";
import UpvoteButton from "../components/UpvoteButton";
import NotificationBell from "../components/NotificationBell";
import Civic3DMap from "../components/map/Civic3DMap";
import { civicTheme } from "../styles/civicTheme";
import { DEFAULT_INDIA_LOCATION } from "../config/env";

const LIVE_FEED_REFRESH_MS = 10000;

/**
 * 🏛️ HomeScreen: Official Citizen Grievance Portal & 3D GIS Dashboard
 */
export default function HomeScreen({ navigate, setSharedLocation, currentUserId }) {
  const [userLocation, setUserLocation] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  const standardizeIssue = (issue) => {
    if (!issue) return null;
    let issueLat = 0;
    let issueLng = 0;

    if (issue.locationPin && issue.locationPin.coordinates) {
      issueLng = issue.locationPin.coordinates[0];
      issueLat = issue.locationPin.coordinates[1];
    } else if (issue.latitude && issue.longitude) {
      issueLat = issue.latitude;
      issueLng = issue.longitude;
    }

    return { ...issue, latitude: issueLat, longitude: issueLng };
  };

  const loadLiveFeed = async () => {
    try {
      const liveData = await fetchGrievances(currentUserId);
      const list = Array.isArray(liveData) ? liveData : [];
      setIssues(list.map(standardizeIssue).filter(Boolean));
    } catch (e) {
      console.warn("loadLiveFeed error:", e);
      setIssues([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        let regionCoords = null;

        if (status === "granted") {
          let loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          regionCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          };
          if (isMounted) {
            setUserLocation(regionCoords);
            setSharedLocation(regionCoords);
          }
        } else {
          const fallback = {
            latitude: DEFAULT_INDIA_LOCATION.latitude,
            longitude: DEFAULT_INDIA_LOCATION.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          };
          if (isMounted) {
            setUserLocation(fallback);
            setSharedLocation(fallback);
          }
        }
      } catch (err) {
        console.warn("Location error on web:", err);
        const fallback = {
          latitude: DEFAULT_INDIA_LOCATION.latitude,
          longitude: DEFAULT_INDIA_LOCATION.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        };
        if (isMounted) {
          setUserLocation(fallback);
          setSharedLocation(fallback);
        }
      }

      await loadLiveFeed();
      if (isMounted) setLoading(false);
    })();

    const pollTimer = setInterval(() => {
      loadLiveFeed();
    }, LIVE_FEED_REFRESH_MS);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [currentUserId]);

  const validIssues = issues.filter((issue) => {
    if (!issue) return false;
    const lat = parseFloat(issue.latitude);
    const lng = parseFloat(issue.longitude);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  });

  const filteredIssues = validIssues.filter((issue) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (issue.title && issue.title.toLowerCase().includes(q)) ||
      (issue.description && issue.description.toLowerCase().includes(q)) ||
      (issue.category && issue.category.toLowerCase().includes(q)) ||
      (issue.department && issue.department.toLowerCase().includes(q))
    );
  });

  const resolvedCount = issues.filter(
    (i) => (i.status || "").toUpperCase() === "RESOLVED" || (i.status || "").toUpperCase() === "SOLVED"
  ).length;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { backgroundColor: "#060d19", paddingBottom: 130 }]}
    >
      {/* 🏛️ Official Government Portal Top Bar */}
      <View style={localStyles.govTopBar}>
        <View style={localStyles.emblemContainer}>
          <View style={localStyles.emblemBadge}>
            <Ionicons name="business" size={16} color={civicTheme.colors.civicBlueLight} />
          </View>
          <View>
            <Text style={localStyles.govTitle}>CIVICSYNC • MUNICIPAL PORTAL</Text>
            <Text style={localStyles.govSubTitle}>Tamil Nadu Municipal Grievance Redressal</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <NotificationBell userId={currentUserId} onPress={() => navigate("notifications")} size={22} color="#ffffff" />
          <TouchableOpacity
            style={localStyles.profileBtn}
            onPress={() => navigate("account")}
            activeOpacity={0.8}
          >
            <Ionicons name="person" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔍 Search Input Bar */}
      <View style={localStyles.searchBarContainer}>
        <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search civic grievances by department, ward, issue..."
          placeholderTextColor="#64748b"
          value={searchFilter}
          onChangeText={setSearchFilter}
          style={localStyles.searchInput}
        />
        {searchFilter.length > 0 && (
          <TouchableOpacity onPress={() => setSearchFilter("")}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* 📊 Municipal Performance Pulse Metrics */}
      <View style={localStyles.pulseCardsRow}>
        <View style={localStyles.pulseCard}>
          <Text style={localStyles.pulseNumber}>{validIssues.length}</Text>
          <Text style={localStyles.pulseLabel}>Active in Ward</Text>
        </View>
        <View style={[localStyles.pulseCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
          <Text style={[localStyles.pulseNumber, { color: '#10b981' }]}>{resolvedCount}</Text>
          <Text style={localStyles.pulseLabel}>Redressed</Text>
        </View>
        <View style={[localStyles.pulseCard, { borderColor: 'rgba(217, 119, 6, 0.3)' }]}>
          <Text style={[localStyles.pulseNumber, { color: '#f59e0b' }]}>
            {issues.reduce((acc, curr) => acc + (curr.upvoteCount || 0), 0)}
          </Text>
          <Text style={localStyles.pulseLabel}>Civic Upvotes</Text>
        </View>
      </View>

      {/* 🗺️ 3D Smart City GIS Live Area Card */}
      <View style={localStyles.gisSectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="layers" size={16} color={civicTheme.colors.civicBlueLight} style={{ marginRight: 6 }} />
          <Text style={localStyles.gisSectionTitle}>3D SMART CITY GIS MAP</Text>
        </View>
        <TouchableOpacity onPress={() => navigate("mapExplorer")} activeOpacity={0.8}>
          <Text style={localStyles.expandText}>Expand Regional GIS ↗</Text>
        </TouchableOpacity>
      </View>

      <View style={localStyles.gisMapWrapper}>
        {loading ? (
          <View style={localStyles.mapLoadingBox}>
            <ActivityIndicator size="small" color={civicTheme.colors.civicBlueLight} />
            <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 6 }}>Loading 3D GIS Tiles...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={{ width: '100%', height: '100%' }}
            activeOpacity={0.9}
            onPress={() => navigate("mapExplorer")}
          >
            <Civic3DMap
              initialLocation={userLocation}
              issues={validIssues}
              interactive={false}
              showControls={false}
            />
            <View style={localStyles.mapOverlayTapBanner}>
              <Ionicons name="expand" size={13} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={localStyles.mapOverlayTapText}>Click to Open Interactive Fullscreen Map</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* ⚡ Civic Quick Action Service Bar */}
      <View style={localStyles.quickActionRow}>
        <TouchableOpacity
          style={localStyles.primaryFileBtn}
          onPress={() => navigate("fileGrievance")}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={localStyles.primaryFileBtnText}>Lodge Grievance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.secondaryActionBtn}
          onPress={() => navigate("grievances")}
          activeOpacity={0.85}
        >
          <Ionicons name="time" size={16} color={civicTheme.colors.civicBlueLight} style={{ marginRight: 4 }} />
          <Text style={localStyles.secondaryActionText}>Track Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.secondaryActionBtn}
          onPress={() => navigate("departments")}
          activeOpacity={0.85}
        >
          <Ionicons name="grid" size={16} color={civicTheme.colors.civicBlueLight} style={{ marginRight: 4 }} />
          <Text style={localStyles.secondaryActionText}>Departments</Text>
        </TouchableOpacity>
      </View>

      {/* 📋 Official Live Grievance Feed */}
      <View style={localStyles.feedSectionHeader}>
        <Text style={localStyles.feedSectionTitle}>OFFICIAL WARD GRIEVANCES FEED</Text>
        <Text style={localStyles.feedCountTag}>{filteredIssues.length} ACTIVE</Text>
      </View>

      <View>
        {loading ? (
          <ActivityIndicator size="small" color={civicTheme.colors.civicBlueLight} style={{ marginVertical: 20 }} />
        ) : filteredIssues.length === 0 ? (
          <View style={localStyles.emptyFeedContainer}>
            <Ionicons name="shield-checkmark" size={38} color="#10b981" />
            <Text style={localStyles.emptyFeedTitle}>All Clear in Your Ward</Text>
            <Text style={localStyles.emptyFeedSub}>No open public complaints matching your criteria.</Text>
          </View>
        ) : (
          filteredIssues.map((issue) => {
            const isResolved =
              (issue.status || "").toUpperCase() === "SOLVED" ||
              (issue.status || "").toUpperCase() === "RESOLVED";

            return (
              <View key={issue.id.toString()} style={localStyles.feedCard}>
                <View style={localStyles.cardHeaderRow}>
                  <View
                    style={[
                      localStyles.statusBadge,
                      {
                        backgroundColor: isResolved ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        borderColor: isResolved ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        localStyles.statusDot,
                        { backgroundColor: isResolved ? "#10b981" : "#ef4444" },
                      ]}
                    />
                    <Text
                      style={[
                        localStyles.statusText,
                        { color: isResolved ? "#10b981" : "#ef4444" },
                      ]}
                    >
                      {issue.status || "Pending"}
                    </Text>
                  </View>

                  <Text style={localStyles.cardCategory}>
                    {issue.category || issue.department || "General"}
                  </Text>
                </View>

                <Text style={localStyles.cardTitle}>{issue.title}</Text>
                <Text style={localStyles.cardDesc} numberOfLines={2}>
                  {issue.description}
                </Text>

                {issue.imageUrl && (
                  <View style={localStyles.mediaThumbnailBox}>
                    <Image
                      source={{ uri: getMediaUrl(issue.imageUrl) }}
                      style={localStyles.cardImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View style={localStyles.cardFooterDivider} />

                <View style={localStyles.cardFooterRow}>
                  <UpvoteButton grievanceItem={issue} currentCitizenId={currentUserId} />

                  <View style={localStyles.locationRow}>
                    <Ionicons name="location-sharp" size={13} color={civicTheme.colors.civicBlueLight} />
                    <Text style={localStyles.locationCoordsText}>
                      {parseFloat(issue.latitude).toFixed(4)}, {parseFloat(issue.longitude).toFixed(4)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  govTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  emblemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emblemBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  govTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  govSubTitle: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 34, 64, 0.85)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
  },
  pulseCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  pulseCard: {
    flex: 1,
    backgroundColor: 'rgba(17, 34, 64, 0.85)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
  },
  pulseLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gisSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gisSectionTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  expandText: {
    color: civicTheme.colors.civicBlueLight,
    fontSize: 11,
    fontWeight: '700',
  },
  gisMapWrapper: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: '#060d19',
    marginBottom: 16,
    position: 'relative',
  },
  mapOverlayTapBanner: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  mapOverlayTapText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  mapLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  primaryFileBtn: {
    flex: 1.4,
    backgroundColor: civicTheme.colors.civicBlue,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    ...civicTheme.shadows.subtle,
  },
  primaryFileBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: 'rgba(17, 34, 64, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  feedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feedSectionTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  feedCountTag: {
    color: civicTheme.colors.civicBlueLight,
    fontSize: 10,
    fontWeight: '700',
  },
  feedCard: {
    backgroundColor: 'rgba(17, 34, 64, 0.85)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...civicTheme.shadows.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: '700',
    color: civicTheme.colors.civicBlueLight,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 10,
  },
  mediaThumbnailBox: {
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardFooterDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationCoordsText: {
    color: '#64748b',
    fontSize: 10,
    marginLeft: 4,
  },
  emptyFeedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    backgroundColor: 'rgba(17, 34, 64, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyFeedTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyFeedSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
});