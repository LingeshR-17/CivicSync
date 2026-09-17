import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Pressable,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../styles/globalStyles";
// 🔌 Import your live network helper instead of the old mock data layout
import { fetchGrievances, getMediaUrl, toggleUpvote } from "../api/api";

export default function MapExplorerScreen({ navigate, userLocation, currentUserId }) {
  const [issues, setIssues] = useState([]); // Default to empty array for DB records
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null); // 🎯 Tapped pin's full grievance details
  const [upvoteLoading, setUpvoteLoading] = useState(false);

  // 🔄 Fetch all real-time complaints from your Java backend when screen loads
  useEffect(() => {
    async function loadMapData() {
      try {
        // 🎯 Every registered grievance pin must be visible to every user browsing
        // the map. citizenId is only passed so upvotedByMe reflects this viewer.
        const liveIssues = await fetchGrievances(currentUserId);
        setIssues(liveIssues);
      } catch (error) {
        console.error("Map data load error:", error);
        Alert.alert(
          "Data Sync Issue",
          "Could not load active pins from the regional database server.",
        );
      } finally {
        setMapLoading(false);
      }
    }
    loadMapData();
  }, [currentUserId]);

  // 👍 Real, server-backed upvote — one per citizen, enforced by the backend,
  // same rule as the Grievances tab (not a local-only counter anymore).
  const handleUpvote = async (issue) => {
    if (!currentUserId) {
      Alert.alert("Sign in required", "Please log in to upvote a grievance.");
      return;
    }
    if (upvoteLoading) return;
    setUpvoteLoading(true);
    try {
      const result = await toggleUpvote(issue.id, currentUserId);
      const updatedFields = {
        upvotes: typeof result?.upvotes === "number" ? result.upvotes : issue.upvotes,
        upvotedByMe: !!result?.upvotedByMe,
      };
      setIssues((prev) =>
        prev.map((i) => (i.id === issue.id ? { ...i, ...updatedFields } : i)),
      );
      setSelectedIssue((prev) => (prev && prev.id === issue.id ? { ...prev, ...updatedFields } : prev));
    } catch (error) {
      console.error("Map upvote failed:", error);
      Alert.alert("Connection Issue", "Could not synchronize upvote with server.");
    } finally {
      setUpvoteLoading(false);
    }
  };

  if (mapLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>
          Synchronizing Civic Matrix Map...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🧭 Header Back Navigation Arrow bar */}
      <View style={styles.headerFloatingRow}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigate("home")}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitleText}>Regional Explorations</Text>
      </View>

      <MapView
        style={styles.mapElement}
        initialRegion={
          userLocation || {
            latitude: 11.93,
            longitude: 79.49,
            latitudeDelta: 0.07,
            longitudeDelta: 0.07,
          }
        }
      >
        {/* 🔵 Render user position marker pin */}
        {/* 🟢 SAFE USER LOCATION PIN: Verifies valid coordinates are present inside the object before mounting */}
        {userLocation && userLocation.latitude && userLocation.longitude ? (
          <Marker
            coordinate={{
              latitude: parseFloat(userLocation.latitude),
              longitude: parseFloat(userLocation.longitude),
            }}
            title="Your Location"
          >
            <Ionicons name="navigate-circle" size={36} color="#3b82f6" />
          </Marker>
        ) : null}

        {/* 🟢 FIXED ACTIVE DATABASE PINS LOOP */}
        {issues &&
          issues
            .filter(
              (issue) =>
                issue && issue.latitude != null && issue.longitude != null,
            )
            .map((issue) => (
              <Marker
                key={issue.id.toString()}
                coordinate={{
                  latitude: parseFloat(issue.latitude),
                  longitude: parseFloat(issue.longitude),
                }}
                onPress={() => setSelectedIssue(issue)}
              >
                <Ionicons
                  name="location"
                  size={32}
                  color={
                    (issue.status || "").toUpperCase() === "PENDING"
                      ? "#ef4444"
                      : (issue.status || "").toUpperCase() === "SOLVED" ||
                        (issue.status || "").toUpperCase() === "RESOLVED"
                      ? "#4ade80"
                      : "#eab308"
                  }
                />

                {/* 💬 Quick-glance tooltip; tap the pin itself for full details */}
                <Callout tooltip onPress={() => setSelectedIssue(issue)}>
                  <View style={styles.calloutCardContainer}>
                    <Text style={styles.calloutTitle} numberOfLines={1}>{issue.title}</Text>
                    <Text style={styles.calloutDept}>
                      Dept: {issue.department || "General"}
                    </Text>
                    <Text style={styles.calloutTapHint}>Tap pin for full details →</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
      </MapView>

      {/* 🎯 FULL GRIEVANCE DETAILS SHEET — opens when a pin is touched, visible to
          every user regardless of who filed the grievance. Shows the filing
          location and photo evidence so people can decide whether to upvote. */}
      <Modal
        visible={!!selectedIssue}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedIssue(null)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setSelectedIssue(null)}>
          <Pressable style={styles.detailSheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />

            {selectedIssue?.imageUrl ? (
              <Image
                source={{ uri: getMediaUrl(selectedIssue.imageUrl) }}
                style={styles.sheetImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.sheetBody}>
              <View style={styles.sheetHeaderRow}>
                <Text style={styles.sheetTitle} numberOfLines={2}>
                  {selectedIssue?.title}
                </Text>
                <TouchableOpacity onPress={() => setSelectedIssue(null)}>
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sheetDept}>
                {selectedIssue?.department || "General"} · {selectedIssue?.status || "Pending"}
              </Text>

              {selectedIssue?.formattedAddress ? (
                <View style={styles.sheetLocationRow}>
                  <Ionicons name="location-sharp" size={15} color={colors.accent} />
                  <Text style={styles.sheetLocationText}>
                    {selectedIssue.formattedAddress}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.sheetDesc}>{selectedIssue?.description}</Text>

              <View style={styles.sheetFooterRow}>
                <TouchableOpacity
                  style={[styles.sheetUpvoteBtn, selectedIssue?.upvotedByMe && styles.sheetUpvoteBtnActive]}
                  onPress={() => selectedIssue && handleUpvote(selectedIssue)}
                  disabled={upvoteLoading}
                >
                  <Ionicons
                    name={selectedIssue?.upvotedByMe ? "heart" : "heart-outline"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.sheetUpvoteText}>
                    {selectedIssue?.upvotedByMe ? "Upvoted" : "Upvote"} ({selectedIssue?.upvotes || 0})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#94a3b8", marginTop: 12, fontSize: 14 },
  mapElement: { flex: 1 },
  headerFloatingRow: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.85)",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  backIconButton: { marginRight: 12 },
  headerTitleText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  calloutCardContainer: {
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    width: 200,
  },
  calloutTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 2,
  },
  calloutDept: {
    color: "#3b82f6",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  calloutDesc: { color: "#94a3b8", fontSize: 12, marginBottom: 6 },
  calloutTapHint: { color: "#a5f3fc", fontSize: 10, fontWeight: "600", marginTop: 4 },
  upvoteRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  upvoteText: { color: "#3b82f6", fontSize: 11, fontWeight: "bold" },

  // 🎯 Full grievance detail bottom sheet (theme-matched deep teal, same as rest of app)
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,22,27,0.7)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: "#0e2530",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 10,
  },
  sheetImage: {
    width: "100%",
    height: 180,
    marginTop: 14,
  },
  sheetBody: { padding: 20 },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetTitle: { color: "#fff", fontSize: 17, fontWeight: "700", flex: 1, marginRight: 12 },
  sheetDept: { color: "#a5f3fc", fontSize: 12, fontWeight: "600", marginTop: 6 },
  sheetLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 10,
  },
  sheetLocationText: { color: "#94a3b8", fontSize: 12, marginLeft: 6, flex: 1, lineHeight: 17 },
  sheetDesc: { color: "#cbd5e1", fontSize: 13, lineHeight: 19, marginTop: 14 },
  sheetFooterRow: { flexDirection: "row", marginTop: 18 },
  sheetUpvoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#319795",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  sheetUpvoteBtnActive: {
    backgroundColor: "#4fd1c5",
  },
  sheetUpvoteText: { color: "#fff", fontWeight: "700", fontSize: 13, marginLeft: 8 },
});
