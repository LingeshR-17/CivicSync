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
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome5 } from "@expo/vector-icons";
import { createGrievance } from "../api/api";
import { DEPARTMENTS } from "../constants/departments";

export default function FileGrievanceScreen({ navigate, userLocation, currentUserId }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  // 🎯 Media upload states
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const [targetLocation, setTargetLocation] = useState(
    userLocation
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : { latitude: 11.75, longitude: 79.55 },
  );

  // 🎯 UX SIMPLIFICATION: shared icon+color metadata instead of a plain text
  // list, so someone new to apps can recognize a category by its icon rather
  // than parse department jargon.
  const departments = DEPARTMENTS;

  // 📸 Handle Image Picker Selection (Updated to fix deprecation warning)
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return Alert.alert("Permission Required", "App needs permission to access your photo library.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // 🎯 FIX: Updated syntax
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageFile(result.assets[0]);
    }
  };

  // 🎥 Handle Video Picker Selection (Updated to fix deprecation warning)
  const pickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      return Alert.alert("Permission Required", "App needs permission to access your library.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"], // 🎯 FIX: Updated syntax
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setVideoFile(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      return Alert.alert(
        "Missing Fields",
        "Please complete all text entry summaries before broadcasting.",
      );
    }

    setSubmitting(true);

    // 🎯 PAYLOAD ALIGNMENT: Pack fields into FormData to allow binary transfers to your API
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("departmentId", selectedDeptId.toString());
    formData.append("latitude", targetLocation.latitude.toString());
    formData.append("longitude", targetLocation.longitude.toString());
    // 🎯 FIX: Attach the real logged-in citizen's ID so the backend stops hardcoding it to 1
    formData.append("citizenId", (currentUserId || 1).toString());

    // Append image if present
    if (imageFile) {
      const imageUriParts = imageFile.uri.split(".");
      const imageExtension = imageUriParts[imageUriParts.length - 1];
      formData.append("image", {
        uri: imageFile.uri,
        name: `photo_${Date.now()}.${imageExtension}`,
        type: `image/${imageExtension === "jpg" ? "jpeg" : imageExtension}`,
      });
    }

    // Append video if present
    if (videoFile) {
      const videoUriParts = videoFile.uri.split(".");
      const videoExtension = videoUriParts[videoUriParts.length - 1];
      formData.append("video", {
        uri: videoFile.uri,
        name: `video_${Date.now()}.${videoExtension}`,
        type: `video/${videoExtension}`,
      });
    }

    try {
      await createGrievance(formData);

      Alert.alert(
        "Grievance Lodged",
        "Your issue is now active on regional map dashboards.",
        [{ text: "OK", onPress: () => navigate("home") }],
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Submission Failed",
        "Could not send multipart payload. Ensure your Java controller accepts request parts.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#103e4b", "#07161b"]} style={{ flex: 1 }}>
      <View style={localStyles.headerRow}>
        <TouchableOpacity onPress={() => navigate("home")}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={localStyles.heading}>File Grievance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <TextInput
          style={localStyles.input}
          placeholder="Grievance Title Summary"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[localStyles.input, { height: 90 }]}
          multiline
          placeholder="Provide absolute situation details..."
          placeholderTextColor="#94a3b8"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={localStyles.subLabel}>Target Department Sector:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
          {departments.map((dept) => {
            const isActive = selectedDeptId === dept.id;
            return (
              <TouchableOpacity
                key={dept.id.toString()}
                style={[
                  localStyles.deptIconTile,
                  isActive && { borderColor: dept.color, backgroundColor: dept.color + '22' },
                ]}
                onPress={() => setSelectedDeptId(dept.id)}
                activeOpacity={0.8}
              >
                <FontAwesome5 name={dept.icon} size={20} color={isActive ? dept.color : "#94a3b8"} />
                <Text style={[localStyles.deptIconLabel, isActive && { color: dept.color }]} numberOfLines={1}>
                  {dept.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={localStyles.subLabel}>Attach Supporting Evidence:</Text>
        <View style={localStyles.mediaButtonRow}>
          <TouchableOpacity style={localStyles.mediaPickerBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={20} color="#fff" />
            <Text style={localStyles.mediaBtnText}>{imageFile ? "Change Photo" : "Add Image"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={localStyles.mediaPickerBtn} onPress={pickVideo}>
            <Ionicons name="videocam-outline" size={20} color="#fff" />
            <Text style={localStyles.mediaBtnText}>{videoFile ? "Change Video" : "Add Video"}</Text>
          </TouchableOpacity>
        </View>

        {/* Media Preview Section */}
        {(imageFile || videoFile) && (
          <View style={localStyles.previewContainer}>
            {imageFile && (
              <View style={localStyles.previewWrapper}>
                <Image source={{ uri: imageFile.uri }} style={localStyles.previewThumbnail} />
                <TouchableOpacity style={localStyles.removeBadge} onPress={() => setImageFile(null)}>
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                </TouchableOpacity>
                <Text style={localStyles.previewLabel}>Photo Ready</Text>
              </View>
            )}

            {videoFile && (
              <View style={localStyles.previewWrapper}>
                <View style={[localStyles.previewThumbnail, localStyles.videoPlaceholder]}>
                  <Ionicons name="play-circle-outline" size={32} color="#94a3b8" />
                </View>
                <TouchableOpacity style={localStyles.removeBadge} onPress={() => setVideoFile(null)}>
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                </TouchableOpacity>
                <Text style={localStyles.previewLabel}>Video Ready</Text>
              </View>
            )}
          </View>
        )}

        <Text style={localStyles.subLabel}>Adjust Pin onto exact Target Boundary Location:</Text>
        <View style={localStyles.mapWrapper}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: targetLocation.latitude,
              longitude: targetLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(e) => setTargetLocation(e.nativeEvent.coordinate)}
          >
            <Marker
              draggable
              coordinate={targetLocation}
              title="Grievance Location"
              description="Drag me or tap the map to change location"
              onDragEnd={(e) => setTargetLocation(e.nativeEvent.coordinate)}
            />
          </MapView>
        </View>

        <TouchableOpacity style={localStyles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
              Broadcast Grievance
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const localStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  heading: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
    color: "#fff",
    marginBottom: 14,
    borderColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
  },
  subLabel: {
    color: "#a5f3fc",
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 13,
    marginTop: 6,
  },
  deptTag: {
    backgroundColor: "#334155",
    padding: 10,
    borderRadius: 20,
    marginRight: 8,
    height: 38,
    justifyContent: "center",
  },
  activeDeptTag: { backgroundColor: "#319795" },
  deptIconTile: {
    width: 84,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginRight: 10,
  },
  deptIconLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  mediaButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  mediaPickerBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
  },
  mediaBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  previewContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
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
    backgroundColor: "#1e293b",
  },
  videoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  removeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#07161b",
    borderRadius: 10,
  },
  previewLabel: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
  },
  mapWrapper: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: "#319795",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },
});