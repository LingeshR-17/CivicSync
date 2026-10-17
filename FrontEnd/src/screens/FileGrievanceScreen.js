import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome5 } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { createGrievance } from "../api/api";
import { DEPARTMENTS } from "../constants/departments";
import { civicTheme } from "../styles/civicTheme";
import { DEFAULT_INDIA_LOCATION } from "../config/env";

export default function FileGrievanceScreen({ navigate, userLocation, currentUserId }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Status banner / feedback
  const [statusBanner, setStatusBanner] = useState({ type: null, message: "" });

  // Media upload states
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  // 📍 Location State (Defaulted to Villupuram / Tamil Nadu)
  const [resolvedLocation, setResolvedLocation] = useState({
    latitude: userLocation?.latitude || DEFAULT_INDIA_LOCATION.latitude,
    longitude: userLocation?.longitude || DEFAULT_INDIA_LOCATION.longitude,
    formattedAddress: "Villupuram, Tamil Nadu, India",
    ward: "Ward 1",
    city: "Villupuram",
  });

  // 🗺️ Full View Map Modal State
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [modalCoords, setModalCoords] = useState({
    latitude: resolvedLocation.latitude,
    longitude: resolvedLocation.longitude,
  });
  const [modalAddress, setModalAddress] = useState(resolvedLocation.formattedAddress);
  const [geocodingLocation, setGeocodingLocation] = useState(false);

  const notifyUser = (titleStr, msgStr, isErr = false) => {
    setStatusBanner({ type: isErr ? "error" : "success", message: `${titleStr}: ${msgStr}` });
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${titleStr}\n\n${msgStr}`);
    } else {
      Alert.alert(titleStr, msgStr);
    }
  };

  // Handle Photo Picker
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return notifyUser("Permission Required", "App needs permission to attach photographic proof.", true);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImageFile(result.assets[0]);
    }
  };

  // Handle Video Picker
  const pickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return notifyUser("Permission Required", "App needs permission to attach video proof.", true);
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setVideoFile(result.assets[0]);
    }
  };

  // Reverse geocode when pin moves in full map modal
  const reverseGeocode = async (lat, lng) => {
    setGeocodingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "CivicSync-App/1.0" } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setModalAddress(addr);
      }
    } catch (_) {
      setModalAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setGeocodingLocation(false);
    }
  };

  const handleOpenMapModal = () => {
    setModalCoords({
      latitude: resolvedLocation.latitude,
      longitude: resolvedLocation.longitude,
    });
    setModalAddress(resolvedLocation.formattedAddress);
    setIsMapModalOpen(true);
  };

  const handleConfirmLocationFromModal = () => {
    setResolvedLocation((prev) => ({
      ...prev,
      latitude: modalCoords.latitude,
      longitude: modalCoords.longitude,
      formattedAddress: modalAddress || prev.formattedAddress,
    }));
    setIsMapModalOpen(false);
  };

  // 📩 Handle Grievance Submit
  const handleSubmit = async () => {
    if (!title.trim()) {
      notifyUser("Required Field", "Please enter the Grievance Subject / Title.", true);
      return;
    }
    if (!description.trim()) {
      notifyUser("Required Field", "Please enter a detailed description of the issue.", true);
      return;
    }

    setSubmitting(true);
    setStatusBanner({ type: "info", message: "Submitting official grievance to municipal server..." });

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("departmentId", selectedDeptId.toString());
      formData.append("latitude", resolvedLocation.latitude.toString());
      formData.append("longitude", resolvedLocation.longitude.toString());
      formData.append("citizenId", (currentUserId || 1).toString());
      formData.append("formattedAddress", resolvedLocation.formattedAddress || "Villupuram, Tamil Nadu");

      // Attach photographic evidence (Cross-platform compatibility)
      if (imageFile) {
        if (Platform.OS === "web" && imageFile.file) {
          formData.append("image", imageFile.file);
        } else if (Platform.OS === "web" && imageFile.uri && imageFile.uri.startsWith("blob:")) {
          try {
            const blobRes = await fetch(imageFile.uri);
            const blob = await blobRes.blob();
            formData.append("image", blob, `proof_${Date.now()}.jpg`);
          } catch (_) {
            formData.append("image", imageFile.uri);
          }
        } else {
          const uriParts = (imageFile.uri || "").split(".");
          const ext = uriParts[uriParts.length - 1] || "jpg";
          formData.append("image", {
            uri: imageFile.uri,
            name: `proof_${Date.now()}.${ext}`,
            type: `image/${ext === "jpg" ? "jpeg" : ext}`,
          });
        }
      }

      // Attach video evidence
      if (videoFile) {
        if (Platform.OS === "web" && videoFile.file) {
          formData.append("video", videoFile.file);
        } else if (Platform.OS === "web" && videoFile.uri && videoFile.uri.startsWith("blob:")) {
          try {
            const blobRes = await fetch(videoFile.uri);
            const blob = await blobRes.blob();
            formData.append("video", blob, `video_${Date.now()}.mp4`);
          } catch (_) {
            formData.append("video", videoFile.uri);
          }
        } else {
          const uriParts = (videoFile.uri || "").split(".");
          const ext = uriParts[uriParts.length - 1] || "mp4";
          formData.append("video", {
            uri: videoFile.uri,
            name: `video_${Date.now()}.${ext}`,
            type: `video/${ext}`,
          });
        }
      }

      const res = await createGrievance(formData);

      const ticketNum = res.ticketNumber || `TN-CIV-${Date.now().toString().slice(-5)}`;
      notifyUser(
        "Grievance Lodged Successfully! 🎉",
        `Your grievance has been officially registered.\n\nTicket Number: ${ticketNum}\nStatus: ${res.status || "PENDING"}`
      );

      // Return to home dashboard
      setTimeout(() => {
        if (navigate) navigate("home");
      }, 1000);
    } catch (error) {
      console.error("Grievance submission error:", error);
      const errMsg = error.response?.data?.error || error.message || "Failed to lodge grievance.";
      notifyUser("Submission Error", errMsg, true);
    } finally {
      setSubmitting(false);
    }
  };

  // Leaflet 2D HTML Map Generator for Full Screen Modal
  const generateModalMapHtml = (lat, lng) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0a192f; }
        .pin-callout {
          background: #0f172a; color: #fff; padding: 6px 10px; border-radius: 6px;
          border: 1px solid #38bdf8; font-size: 11px; font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var centerLat = ${lat};
        var centerLng = ${lng};
        var map = L.map('map', { zoomControl: true }).setView([centerLat, centerLng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        var marker = L.marker([centerLat, centerLng], { draggable: true }).addTo(map);
        marker.bindPopup("<div class='pin-callout'>📍 Selected Issue Location</div>").openPopup();

        function sendCoords(lat, lng) {
          var payload = JSON.stringify({ type: 'PIN_SELECTED', latitude: lat, longitude: lng });
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(payload);
          } else if (window.parent) {
            window.parent.postMessage(payload, '*');
          }
        }

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          sendCoords(e.latlng.lat, e.latlng.lng);
        });

        marker.on('dragend', function(e) {
          var pos = marker.getLatLng();
          sendCoords(pos.lat, pos.lng);
        });
      </script>
    </body>
    </html>
  `;

  // Listen for iframe/webview message when running on Web
  React.useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleWebMsg = (e) => {
        try {
          const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          if (data && data.type === "PIN_SELECTED") {
            setModalCoords({ latitude: data.latitude, longitude: data.longitude });
            reverseGeocode(data.latitude, data.longitude);
          }
        } catch (_) {}
      };
      window.addEventListener("message", handleWebMsg);
      return () => window.removeEventListener("message", handleWebMsg);
    }
  }, []);

  return (
    <LinearGradient colors={civicTheme.colors.gradients.officialNavy} style={{ flex: 1 }}>
      {/* Header */}
      <View style={localStyles.headerRow}>
        <TouchableOpacity
          onPress={() => navigate("home")}
          style={localStyles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={localStyles.heading}>LODGE CIVIC GRIEVANCE</Text>
          <Text style={localStyles.subHeading}>Official Municipal Redressal Portal</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        {statusBanner.message ? (
          <View
            style={[
              localStyles.bannerBox,
              statusBanner.type === "error"
                ? localStyles.bannerError
                : statusBanner.type === "info"
                ? localStyles.bannerInfo
                : localStyles.bannerSuccess,
            ]}
          >
            <Ionicons
              name={
                statusBanner.type === "error"
                  ? "alert-circle"
                  : statusBanner.type === "info"
                  ? "information-circle"
                  : "checkmark-circle"
              }
              size={18}
              color="#fff"
            />
            <Text style={localStyles.bannerText}>{statusBanner.message}</Text>
          </View>
        ) : null}

        {/* 1. Category Department Selector */}
        <Text style={localStyles.fieldLabel}>1. SELECT MUNICIPAL DEPARTMENT</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {DEPARTMENTS.map((dept) => {
            const isSelected = selectedDeptId === dept.id;
            return (
              <TouchableOpacity
                key={dept.id}
                style={[
                  localStyles.deptIconTile,
                  isSelected && {
                    borderColor: civicTheme.colors.civicBlueLight,
                    backgroundColor: "rgba(14, 116, 144, 0.4)",
                  },
                ]}
                onPress={() => setSelectedDeptId(dept.id)}
                activeOpacity={0.8}
              >
                <FontAwesome5
                  name={dept.icon}
                  size={22}
                  color={isSelected ? civicTheme.colors.civicBlueLight : "#94a3b8"}
                />
                <Text
                  style={[
                    localStyles.deptIconLabel,
                    isSelected && { color: "#ffffff", fontWeight: "700" },
                  ]}
                  numberOfLines={2}
                >
                  {dept.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. Grievance Subject / Title */}
        <Text style={localStyles.fieldLabel}>2. GRIEVANCE SUBJECT</Text>
        <TextInput
          style={localStyles.input}
          placeholder="e.g. Broken Water Pipe near Gandhi Road"
          placeholderTextColor="#64748b"
          value={title}
          onChangeText={setTitle}
        />

        {/* 3. Detailed Description */}
        <Text style={localStyles.fieldLabel}>3. DETAILED CITIZEN STATEMENT</Text>
        <TextInput
          style={[localStyles.input, { height: 100, textAlignVertical: "top" }]}
          placeholder="Describe the nature of the issue, nearest landmarks, and impact on local residents..."
          placeholderTextColor="#64748b"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        {/* 4. Photographic & Video Evidence */}
        <Text style={localStyles.fieldLabel}>4. ATTACH EVIDENCE (OPTIONAL)</Text>
        <View style={localStyles.mediaButtonRow}>
          <TouchableOpacity
            style={localStyles.mediaPickerBtn}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={18} color="#38bdf8" />
            <Text style={localStyles.mediaBtnText}>
              {imageFile ? "Change Photo" : "Attach Photo"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={localStyles.mediaPickerBtn}
            onPress={pickVideo}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam" size={18} color="#38bdf8" />
            <Text style={localStyles.mediaBtnText}>
              {videoFile ? "Change Video" : "Attach Video"}
            </Text>
          </TouchableOpacity>
        </View>

        {(imageFile || videoFile) && (
          <View style={localStyles.previewContainer}>
            {imageFile && (
              <View style={localStyles.previewWrapper}>
                <Image source={{ uri: imageFile.uri }} style={localStyles.previewThumbnail} />
                <TouchableOpacity
                  style={localStyles.removeBadge}
                  onPress={() => setImageFile(null)}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
                <Text style={localStyles.previewLabel}>Photo Ready</Text>
              </View>
            )}

            {videoFile && (
              <View style={localStyles.previewWrapper}>
                <View style={[localStyles.previewThumbnail, localStyles.videoPlaceholder]}>
                  <Ionicons name="play-circle-outline" size={32} color="#38bdf8" />
                </View>
                <TouchableOpacity
                  style={localStyles.removeBadge}
                  onPress={() => setVideoFile(null)}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
                <Text style={localStyles.previewLabel}>Video Attached</Text>
              </View>
            )}
          </View>
        )}

        {/* 5. 📍 Clean Map Location Section (Touch Map Card to Open Full View) */}
        <Text style={localStyles.fieldLabel}>5. MUNICIPAL LOCATION PINNING</Text>
        <TouchableOpacity
          style={localStyles.locationTouchCard}
          onPress={handleOpenMapModal}
          activeOpacity={0.85}
        >
          <View style={localStyles.locationCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <View style={localStyles.locationPinCircle}>
                <Ionicons name="location-sharp" size={20} color="#38bdf8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={localStyles.locationAddressText} numberOfLines={2}>
                  {resolvedLocation.formattedAddress}
                </Text>
                <Text style={localStyles.locationCoordsText}>
                  Coordinates: {resolvedLocation.latitude.toFixed(4)},{" "}
                  {resolvedLocation.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          </View>

          {/* Touch To Open Map Prompt */}
          <View style={localStyles.touchMapPrompt}>
            <Ionicons name="map-outline" size={16} color="#38bdf8" />
            <Text style={localStyles.touchMapPromptText}>
              Touch here to open full map view and adjust pin location
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </View>
        </TouchableOpacity>

        {/* 6. Official Submit Button */}
        <TouchableOpacity
          style={[localStyles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="shield-checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={localStyles.submitBtnText}>Submit Official Grievance</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 🗺️ FULL VIEW MAP MODAL */}
      <Modal
        visible={isMapModalOpen}
        animationType="slide"
        onRequestClose={() => setIsMapModalOpen(false)}
      >
        <LinearGradient colors={civicTheme.colors.gradients.officialNavy} style={{ flex: 1 }}>
          {/* Modal Header */}
          <View style={localStyles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsMapModalOpen(false)}
              style={localStyles.modalCloseBtn}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={localStyles.modalHeaderTitle}>SELECT GRIEVANCE LOCATION</Text>
              <Text style={localStyles.modalHeaderSubtitle}>
                Tap anywhere on the map or drag the pin
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleConfirmLocationFromModal}
              style={localStyles.modalConfirmPill}
            >
              <Text style={localStyles.modalConfirmPillText}>Confirm ✓</Text>
            </TouchableOpacity>
          </View>

          {/* Live Address Readout in Modal */}
          <View style={localStyles.modalAddressBar}>
            <Ionicons name="pin" size={16} color="#38bdf8" style={{ marginRight: 6 }} />
            {geocodingLocation ? (
              <ActivityIndicator size="small" color="#38bdf8" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={localStyles.modalAddressText} numberOfLines={2}>
              {modalAddress || "Resolving address..."}
            </Text>
          </View>

          {/* Full Screen 2D Map */}
          <View style={{ flex: 1 }}>
            {Platform.OS === "web" ? (
              <iframe
                title="Grievance Full View Map"
                srcDoc={generateModalMapHtml(modalCoords.latitude, modalCoords.longitude)}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <WebView
                originWhitelist={["*"]}
                source={{ html: generateModalMapHtml(modalCoords.latitude, modalCoords.longitude) }}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === "PIN_SELECTED") {
                      setModalCoords({ latitude: data.latitude, longitude: data.longitude });
                      reverseGeocode(data.latitude, data.longitude);
                    }
                  } catch (_) {}
                }}
                style={{ flex: 1 }}
              />
            )}
          </View>

          {/* Bottom Confirm Action Bar */}
          <View style={localStyles.modalBottomBar}>
            <TouchableOpacity
              style={localStyles.modalSubmitBtn}
              onPress={handleConfirmLocationFromModal}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={localStyles.modalSubmitBtnText}>Set This Location</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const localStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0a192f",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  subHeading: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  bannerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  bannerError: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  bannerSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderWidth: 1,
    borderColor: "#10b981",
  },
  bannerInfo: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  bannerText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  fieldLabel: {
    color: civicTheme.colors.civicBlueLight,
    marginBottom: 8,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: "rgba(17, 34, 64, 0.85)",
    borderRadius: 10,
    padding: 14,
    color: "#ffffff",
    marginBottom: 14,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    fontSize: 13,
  },
  deptIconTile: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 34, 64, 0.8)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginRight: 10,
  },
  deptIconLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  mediaButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  mediaPickerBtn: {
    backgroundColor: "rgba(17, 34, 64, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
  },
  mediaBtnText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },
  previewContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 25, 47, 0.8)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  previewWrapper: {
    marginRight: 16,
    alignItems: "center",
    position: "relative",
  },
  previewThumbnail: {
    width: 65,
    height: 65,
    borderRadius: 8,
    backgroundColor: "#112240",
  },
  videoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  removeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#060d19",
    borderRadius: 10,
  },
  previewLabel: {
    color: "#94a3b8",
    fontSize: 9,
    marginTop: 4,
    fontWeight: "600",
  },
  locationTouchCard: {
    backgroundColor: "rgba(17, 34, 64, 0.85)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    padding: 14,
    marginBottom: 16,
  },
  locationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  locationPinCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationAddressText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  locationCoordsText: {
    color: "#94a3b8",
    fontSize: 11,
  },
  touchMapPrompt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  touchMapPromptText: {
    color: "#38bdf8",
    fontSize: 11,
    fontWeight: "700",
    flex: 1,
  },
  submitBtn: {
    backgroundColor: civicTheme.colors.civicBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    ...civicTheme.shadows.card,
  },
  submitBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0a192f",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  modalHeaderSubtitle: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 2,
  },
  modalConfirmPill: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalConfirmPillText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  modalAddressBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17, 34, 64, 0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(56, 189, 248, 0.2)",
  },
  modalAddressText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  modalBottomBar: {
    padding: 16,
    backgroundColor: "#0a192f",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  modalSubmitBtn: {
    backgroundColor: civicTheme.colors.civicBlue,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    ...civicTheme.shadows.subtle,
  },
  modalSubmitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});