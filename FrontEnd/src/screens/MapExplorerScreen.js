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
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchGrievances, getMediaUrl, toggleUpvote, searchIndianLocations, reverseGeocodeIndianAddress } from "../api/api";
import Civic3DMap from "../components/map/Civic3DMap";
import { civicTheme } from "../styles/civicTheme";
import { DEPARTMENTS } from "../constants/departments";
import { DEFAULT_INDIA_LOCATION } from "../config/env";

/**
 * 🏛️ MapExplorerScreen: Official Regional 3D GIS Smart City Exploration Portal
 */
export default function MapExplorerScreen({ navigate, userLocation, currentUserId, setSharedLocation }) {
  const [issues, setIssues] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [upvoteLoading, setUpvoteLoading] = useState(false);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'PENDING' | 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [targetFlyCoords, setTargetFlyCoords] = useState(null);

  // Dropped Pin State (Clicking any road or place)
  const [droppedPin, setDroppedPin] = useState(null);
  const [droppedPinAddress, setDroppedPinAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    async function loadMapData() {
      try {
        const liveIssues = await fetchGrievances(currentUserId);
        setIssues(liveIssues || []);
      } catch (error) {
        console.error("Map data load error:", error);
        Alert.alert(
          "Data Sync Issue",
          "Could not load active GIS records from the regional database.",
        );
      } finally {
        setMapLoading(false);
      }
    }
    loadMapData();
  }, [currentUserId]);

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
        upvotes: typeof result?.upvotes === "number" ? result.upvotes : (issue.upvotes || 0) + 1,
        upvotedByMe: !issue.upvotedByMe,
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

  const handleSearchIndianPlace = async (text) => {
    setSearchQuery(text);
    if (text.trim().length >= 2) {
      setIsSearching(true);
      const results = await searchIndianLocations(text);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSearchResult = (result) => {
    const coords = { latitude: result.latitude, longitude: result.longitude, zoom: 17 };
    setTargetFlyCoords(coords);
    setSearchQuery("");
    setSearchResults([]);
    setDroppedPin(coords);
    setDroppedPinAddress({
      street: result.displayName ? result.displayName.split(',')[0] : 'Searched Area',
      formattedAddress: result.displayName
    });
  };

  const handleMapPress = async (coords) => {
    setDroppedPin(coords);
    setTargetFlyCoords(coords);
    setLoadingAddress(true);
    try {
      const res = await reverseGeocodeIndianAddress(coords.latitude, coords.longitude);
      setDroppedPinAddress(res);
    } catch (_) {
      setDroppedPinAddress({
        street: 'Selected Spot',
        formattedAddress: `Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)}`
      });
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleSelectIssue = (markerIssue) => {
    const full = issues.find((i) => String(i.id) === String(markerIssue?.id)) || markerIssue;
    setSelectedIssue(full);
    setDroppedPin(null);
  };

  // Filter issues based on department and status
  const filteredIssues = issues.filter((issue) => {
    if (!issue || issue.latitude == null || issue.longitude == null) return false;

    // Department match
    if (selectedDepartmentFilter !== "All") {
      const deptName = (issue.category || issue.department || "").toLowerCase();
      if (!deptName.includes(selectedDepartmentFilter.toLowerCase())) {
        return false;
      }
    }

    // Status match
    if (statusFilter !== "ALL") {
      const st = (issue.status || "").toUpperCase();
      if (statusFilter === "RESOLVED" && st !== "RESOLVED" && st !== "SOLVED") return false;
      if (statusFilter === "PENDING" && (st === "RESOLVED" || st === "SOLVED")) return false;
    }

    return true;
  });

  return (
    <View style={localStyles.container}>
      {/* 🧭 Official Floating GIS Top Bar */}
      <View style={localStyles.floatingHeader}>
        <View style={localStyles.topBarRow}>
          <TouchableOpacity style={localStyles.backBtn} onPress={() => navigate("home")} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>

          <View style={localStyles.searchContainer}>
            <Ionicons name="search" size={15} color="#94a3b8" style={{ marginRight: 6 }} />
            <TextInput
              style={localStyles.searchInput}
              placeholder="Search Indian locality, ward, city..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={handleSearchIndianPlace}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <View style={localStyles.searchResultsBox}>
            {searchResults.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={localStyles.searchResultItem}
                onPress={() => handleSelectSearchResult(item)}
              >
                <Ionicons name="navigate-circle" size={16} color={civicTheme.colors.civicBlueLight} style={{ marginRight: 8 }} />
                <Text style={localStyles.searchResultText} numberOfLines={1}>{item.displayName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Department Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={localStyles.filtersScroll}>
          <TouchableOpacity
            style={[
              localStyles.filterChip,
              selectedDepartmentFilter === "All" && localStyles.filterChipActive,
            ]}
            onPress={() => setSelectedDepartmentFilter("All")}
          >
            <Text
              style={[
                localStyles.filterChipText,
                selectedDepartmentFilter === "All" && localStyles.filterChipTextActive,
              ]}
            >
              All Departments ({issues.length})
            </Text>
          </TouchableOpacity>

          {DEPARTMENTS.map((dept) => {
            const isActive = selectedDepartmentFilter === dept.name;
            return (
              <TouchableOpacity
                key={dept.id.toString()}
                style={[localStyles.filterChip, isActive && { backgroundColor: dept.color + '33', borderColor: dept.color }]}
                onPress={() => setSelectedDepartmentFilter(isActive ? "All" : dept.name)}
              >
                <Text style={[localStyles.filterChipText, isActive && { color: '#ffffff', fontWeight: '700' }]}>
                  {dept.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 🗺️ 3D Smart City Indian GIS Canvas */}
      {mapLoading ? (
        <View style={localStyles.loadingContainer}>
          <ActivityIndicator size="large" color={civicTheme.colors.civicBlueLight} />
          <Text style={localStyles.loadingText}>Initializing Smart City 3D GIS Vector Layers...</Text>
        </View>
      ) : (
        <Civic3DMap
          initialLocation={userLocation}
          flyToLocation={targetFlyCoords}
          issues={filteredIssues}
          onSelectIssue={handleSelectIssue}
          onMapPress={handleMapPress}
          showControls={true}
          interactive={true}
          style={localStyles.mapElement}
        />
      )}

      {/* 📍 Dropped Pin Information & Fast Filing Action Bar */}
      {droppedPin && !selectedIssue && (
        <View style={localStyles.droppedPinBanner}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location" size={16} color="#f59e0b" style={{ marginRight: 6 }} />
              <Text style={localStyles.droppedPinTitle} numberOfLines={1}>
                {loadingAddress ? "Resolving road / area..." : (droppedPinAddress?.street || "Selected Location")}
              </Text>
            </View>
            <Text style={localStyles.droppedPinSub} numberOfLines={1}>
              {loadingAddress ? "Reverse geocoding boundary..." : (droppedPinAddress?.formattedAddress || `${droppedPin.latitude.toFixed(4)}, ${droppedPin.longitude.toFixed(4)}`)}
            </Text>
          </View>

          <TouchableOpacity
            style={localStyles.fileAtSpotBtn}
            onPress={() => {
              if (setSharedLocation && droppedPin) {
                setSharedLocation({
                  latitude: droppedPin.latitude,
                  longitude: droppedPin.longitude,
                });
              }
              navigate("fileGrievance");
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={15} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={localStyles.fileAtSpotBtnText}>Lodge Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ padding: 6, marginLeft: 6 }}
            onPress={() => setDroppedPin(null)}
          >
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

      {/* 📋 Official Grievance Details Docket Sheet */}
      <Modal
        visible={!!selectedIssue}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedIssue(null)}
      >
        <Pressable style={localStyles.sheetOverlay} onPress={() => setSelectedIssue(null)}>
          <Pressable style={localStyles.detailSheet} onPress={() => {}}>
            <View style={localStyles.sheetHandle} />

            {selectedIssue?.imageUrl && (
              <Image
                source={{ uri: getMediaUrl(selectedIssue.imageUrl) }}
                style={localStyles.sheetImage}
                resizeMode="cover"
              />
            )}

            <View style={localStyles.sheetBody}>
              <View style={localStyles.sheetHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={localStyles.sheetTitle} numberOfLines={2}>
                    {selectedIssue?.title}
                  </Text>
                  <Text style={localStyles.sheetDept}>
                    {selectedIssue?.department || "General"} · Status: {selectedIssue?.status || "Pending"}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedIssue(null)}>
                  <Ionicons name="close-circle" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {selectedIssue?.formattedAddress && (
                <View style={localStyles.sheetLocationRow}>
                  <Ionicons name="location-sharp" size={15} color={civicTheme.colors.civicBlueLight} />
                  <Text style={localStyles.sheetLocationText}>
                    {selectedIssue.formattedAddress}
                  </Text>
                </View>
              )}

              <Text style={localStyles.sheetDesc}>{selectedIssue?.description}</Text>

              <View style={localStyles.sheetFooterRow}>
                <TouchableOpacity
                  style={[
                    localStyles.sheetUpvoteBtn,
                    selectedIssue?.upvotedByMe && localStyles.sheetUpvoteBtnActive,
                  ]}
                  onPress={() => selectedIssue && handleUpvote(selectedIssue)}
                  disabled={upvoteLoading}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={selectedIssue?.upvotedByMe ? "heart" : "heart-outline"}
                    size={16}
                    color="#ffffff"
                  />
                  <Text style={localStyles.sheetUpvoteText}>
                    {selectedIssue?.upvotedByMe ? "Upvoted" : "Priority Upvote"} ({selectedIssue?.upvotes || 0})
                  </Text>
                </TouchableOpacity>

                <View style={localStyles.docketBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                  <Text style={localStyles.docketBadgeText}>Municipal Redressal</Text>
                </View>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060d19",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#060d19",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  mapElement: {
    flex: 1,
  },
  floatingHeader: {
    position: "absolute",
    top: 45,
    left: 14,
    right: 14,
    zIndex: 20,
  },
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(10, 25, 47, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    ...civicTheme.shadows.subtle,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 25, 47, 0.95)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    paddingHorizontal: 12,
    height: 40,
    ...civicTheme.shadows.subtle,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 12,
  },
  searchResultsBox: {
    backgroundColor: "rgba(10, 25, 47, 0.98)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    marginTop: 6,
    overflow: "hidden",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  searchResultText: {
    color: "#ffffff",
    fontSize: 11,
    flex: 1,
  },
  filtersScroll: {
    marginTop: 8,
  },
  filterChip: {
    backgroundColor: "rgba(10, 25, 47, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: civicTheme.colors.civicBlue,
    borderColor: civicTheme.colors.civicBlueLight,
  },
  filterChipText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(6, 13, 25, 0.8)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: "#0a192f",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    maxHeight: "82%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginTop: 8,
  },
  sheetImage: {
    width: "100%",
    height: 180,
    marginTop: 10,
  },
  sheetBody: {
    padding: 18,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  sheetDept: {
    color: civicTheme.colors.civicBlueLight,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  sheetLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
    backgroundColor: "rgba(17, 34, 64, 0.8)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  sheetLocationText: {
    color: "#cbd5e1",
    fontSize: 11,
    marginLeft: 6,
    flex: 1,
  },
  sheetDesc: {
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },
  sheetFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  sheetUpvoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: civicTheme.colors.civicBlue,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sheetUpvoteBtnActive: {
    backgroundColor: "#059669",
  },
  sheetUpvoteText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 6,
  },
  docketBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  docketBadgeText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "700",
  },
  droppedPinBanner: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: "rgba(10, 25, 47, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 20,
  },
  droppedPinTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  droppedPinSub: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 2,
  },
  fileAtSpotBtn: {
    backgroundColor: "#d97706",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fileAtSpotBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
