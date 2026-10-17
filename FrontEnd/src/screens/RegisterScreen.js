import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import axios from "axios";
import { API_ENDPOINTS } from "../config/env";
import { civicTheme } from "../styles/civicTheme";

const BACKEND_URL = API_ENDPOINTS.auth;

export default function RegisterScreen({ onNavigateToLogin, registerUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 📍 Location Telemetry States (Defaults to Villupuram, Tamil Nadu)
  const [locationDetails, setLocationDetails] = useState({
    city: "Villupuram",
    district: "Villupuram",
    ward: "Ward 1",
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  // 📧 Inline Verification States
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [loadingEmailVerify, setLoadingEmailVerify] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // 🔔 In-App Visible Status Banner (Crucial for Web where Alert.alert is not modal)
  const [statusBanner, setStatusBanner] = useState({ type: null, message: "" });

  const notify = (title, message, isError = false) => {
    setStatusBanner({
      type: isError ? "error" : "success",
      message: `${title}: ${message}`,
    });

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message || ""}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 📡 1. Automated Location Fetch with Manual Override Capability
  const handleAutoDetectLocation = async () => {
    setLoadingLocation(true);
    setStatusBanner({ type: "info", message: "Detecting your municipal boundaries..." });
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        notify(
          "Permission Denied",
          "Location access was denied. You can manually enter your City, District, and Ward below.",
          true,
        );
        return;
      }

      let geoPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = geoPosition.coords;

      // Reverse geocode via OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
        {
          headers: {
            "User-Agent": "CivicSync-TamilNadu-App/1.0",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Geocoding service error: ${response.status}`);
      }

      const geoData = await response.json();
      const address = geoData.address || {};

      const detectedCity =
        address.city || address.town || address.village || address.municipality || "Villupuram";
      const detectedDistrict =
        address.state_district || address.county || address.district || "Villupuram";
      const neighborhood =
        address.city_district || address.suburb || address.neighbourhood || address.locality || "";

      let finalWardZone = "";
      if (neighborhood) {
        finalWardZone = neighborhood;
      } else {
        const pincode = parseInt(address.postcode) || 605602;
        finalWardZone = `Ward ${(pincode % 15) + 1}`;
      }

      setLocationDetails({
        city: detectedCity.trim(),
        district: detectedDistrict.trim(),
        ward: finalWardZone.trim(),
      });

      notify(
        "Location Detected",
        `Resolved to ${detectedCity}, ${detectedDistrict}. You can adjust these manually below anytime.`,
      );
    } catch (err) {
      console.error("Geocoding Error Catch:", err);
      notify(
        "Auto-Detect Inaccurate",
        "Could not detect exact GPS coordinates. Please type your city/ward manually below.",
        false,
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  // 📍 Quick Preset Selection
  const applyPresetLocation = (city, district, ward) => {
    setLocationDetails({ city, district, ward });
    setStatusBanner({
      type: "success",
      message: `Jurisdiction updated to ${city}, ${district} (${ward}).`,
    });
  };

  // 📧 2. Dispatch Inline Email OTP Request
  const handleRequestInlineOtp = async () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return notify(
        "Invalid Email",
        "Please enter a structurally valid email address (e.g. name@domain.com).",
        true,
      );
    }

    setLoadingEmailVerify(true);
    setStatusBanner({
      type: "info",
      message: `Connecting to verification service for ${trimmedEmail}...`,
    });

    try {
      const res = await axios.post(`${BACKEND_URL}/request-otp`, {
        email: trimmedEmail,
      });

      setIsOtpSent(true);
      notify(
        "OTP Sent",
        res.data?.message ||
          "A 6-digit confirmation code has been dispatched. Enter it below to verify your account.",
      );
    } catch (err) {
      const serverErr =
        err.response?.data?.error ||
        err.message ||
        "Could not reach the verification service. Check your connection.";
      notify("Verification Request Failed", serverErr, true);
    } finally {
      setLoadingEmailVerify(false);
    }
  };

  // 📧 3. Confirm Email OTP Code Inline
  const handleConfirmInlineOtp = async () => {
    const enteredOtp = otpCode.trim();

    if (enteredOtp.length !== 6) {
      return notify("Code Length Error", "Verification code must be exactly 6 digits.", true);
    }

    setLoadingEmailVerify(true);
    setStatusBanner({ type: "info", message: "Validating security code..." });
    try {
      const res = await axios.post(`${BACKEND_URL}/verify-otp`, {
        email: email.trim(),
        code: enteredOtp,
      });

      if (res.data && (res.data.verified === true || res.data.message)) {
        setIsEmailVerified(true);
        setIsOtpSent(false);
        notify(
          "Email Verified!",
          "Identity confirmed. You can now finalize your registration.",
        );
      } else {
        notify(
          "Invalid OTP",
          res.data?.error || "Incorrect or expired verification code.",
          true,
        );
      }
    } catch (err) {
      notify(
        "Verification Failed",
        err.response?.data?.error || "Invalid or expired verification code.",
        true,
      );
    } finally {
      setLoadingEmailVerify(false);
    }
  };

  // 🔑 4. Core Traditional Registration Submission
  const handleCreateAccountSubmit = async () => {
    if (!isEmailVerified) {
      return notify(
        "Email Verification Required",
        "Please click 'Verify' next to your email address and enter the 6-digit OTP first.",
        true,
      );
    }
    if (!name.trim()) {
      return notify("Missing Field", "Please enter your full name.", true);
    }
    if (!phone.trim()) {
      return notify("Missing Field", "Please enter your mobile phone number.", true);
    }
    if (!password) {
      return notify("Missing Field", "Please enter a secure password.", true);
    }
    if (password !== confirmPassword) {
      return notify("Password Mismatch", "Passwords do not match. Please verify both fields.", true);
    }
    if (!locationDetails.city.trim() || !locationDetails.ward.trim()) {
      return notify(
        "Location Incomplete",
        "Please ensure City and Ward are specified.",
        true,
      );
    }

    setLoadingSubmit(true);
    setStatusBanner({ type: "info", message: "Creating your citizen profile..." });

    try {
      const registrationPayload = {
        name: name.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
        passwordHash: password,
        city: locationDetails.city.trim(),
        district: locationDetails.district.trim(),
        ward: locationDetails.ward.trim(),
      };

      const res = await axios.post(
        `${BACKEND_URL}/register`,
        registrationPayload,
      );

      if (res.data.error) {
        notify("Registration Failed", res.data.error, true);
        return;
      }

      if (res.data.userId) {
        notify(
          "Account Initialized",
          `Welcome ${res.data.name || name}! Registration completed successfully.`,
        );
        if (registerUser) registerUser(res.data);
      }
    } catch (err) {
      notify(
        "Registration Error",
        err.response?.data?.error || "Failed to create account. Please try again.",
        true,
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <LinearGradient colors={civicTheme.colors.gradients.officialNavy} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollFrame}
      >
        <Text style={styles.title}>CIVICSYNC CITIZEN REGISTRATION</Text>
        <Text style={styles.subtitle}>
          Official Municipal Redressal Portal • Citizen Onboarding
        </Text>

        {/* 🔔 In-App Visible Status Banner */}
        {statusBanner.message ? (
          <View
            style={[
              styles.statusBannerBox,
              statusBanner.type === "error"
                ? styles.bannerError
                : statusBanner.type === "info"
                ? styles.bannerInfo
                : styles.bannerSuccess,
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
            <Text style={styles.bannerText}>{statusBanner.message}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          {/* Full Name Input */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Lingesh Raman"
            placeholderTextColor="#64748b"
          />

          {/* Inline Email Verification Block */}
          <Text style={styles.inputLabel}>
            Email Address {isEmailVerified && "✓ (Verified)"}
          </Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={[
                styles.textInput,
                {
                  flex: 1,
                  marginBottom: 0,
                  borderColor: isEmailVerified
                    ? "#10b981"
                    : isOtpSent
                    ? "#38bdf8"
                    : "rgba(255,255,255,0.12)",
                },
              ]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setIsEmailVerified(false);
                setIsOtpSent(false);
              }}
              editable={!isEmailVerified}
              placeholder="name@domain.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[
                styles.inlineButton,
                {
                  backgroundColor: isEmailVerified
                    ? "#10b981"
                    : isOtpSent
                    ? "#0284c7"
                    : civicTheme.colors.civicBlue,
                },
              ]}
              onPress={handleRequestInlineOtp}
              disabled={loadingEmailVerify || isEmailVerified}
            >
              {loadingEmailVerify && !isOtpSent ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.inlineButtonText}>
                  {isEmailVerified
                    ? "Verified ✓"
                    : isOtpSent
                    ? "Resend"
                    : "Verify Email"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Dynamic OTP Verification Input */}
          {isOtpSent && !isEmailVerified && (
            <View style={styles.otpCard}>
              <Text style={styles.otpInstructions}>
                ✉️ Enter the 6-digit verification code sent to your inbox:
              </Text>
              <View style={styles.inlineRow}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      flex: 1,
                      marginBottom: 0,
                      textAlign: "center",
                      letterSpacing: 6,
                      fontSize: 18,
                      fontWeight: "700",
                    },
                  ]}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="000000"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[styles.inlineButton, { backgroundColor: "#10b981" }]}
                  onPress={handleConfirmInlineOtp}
                  disabled={loadingEmailVerify}
                >
                  {loadingEmailVerify ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.inlineButtonText}>Confirm Code</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Phone Number Input */}
          <Text style={styles.inputLabel}>Mobile Phone Number</Text>
          <TextInput
            style={styles.textInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="10-Digit Mobile Number"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            maxLength={10}
          />

          {/* Password Inputs */}
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#64748b"
          />
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.textInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#64748b"
          />

          {/* 📍 Municipal Location / Jurisdiction Section */}
          <View style={styles.sectionDivider} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Municipal Jurisdiction</Text>
            <TouchableOpacity
              style={styles.autoDetectPill}
              onPress={handleAutoDetectLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#38bdf8" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Ionicons name="locate" size={14} color="#38bdf8" />
                  <Text style={{ color: "#38bdf8", fontWeight: "700", fontSize: 11 }}>Auto-Detect</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Preset Buttons */}
          <Text style={{ color: "#94a3b8", fontSize: 11, marginBottom: 8 }}>Quick select your region:</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[
                styles.presetPill,
                locationDetails.city.toLowerCase() === "villupuram" && styles.presetPillActive,
              ]}
              onPress={() => applyPresetLocation("Villupuram", "Villupuram", "Ward 1")}
            >
              <Text
                style={[
                  styles.presetPillText,
                  locationDetails.city.toLowerCase() === "villupuram" && styles.presetPillTextActive,
                ]}
              >
                📍 Villupuram
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetPill,
                locationDetails.city.toLowerCase() === "chennai" && styles.presetPillActive,
              ]}
              onPress={() => applyPresetLocation("Chennai", "Chennai", "Zone 5")}
            >
              <Text
                style={[
                  styles.presetPillText,
                  locationDetails.city.toLowerCase() === "chennai" && styles.presetPillTextActive,
                ]}
              >
                📍 Chennai
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetPill,
                locationDetails.city.toLowerCase() === "cuddalore" && styles.presetPillActive,
              ]}
              onPress={() => applyPresetLocation("Cuddalore", "Cuddalore", "Ward 3")}
            >
              <Text
                style={[
                  styles.presetPillText,
                  locationDetails.city.toLowerCase() === "cuddalore" && styles.presetPillTextActive,
                ]}
              >
                📍 Cuddalore
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetPill,
                locationDetails.city.toLowerCase() === "puducherry" && styles.presetPillActive,
              ]}
              onPress={() => applyPresetLocation("Puducherry", "Puducherry", "East Zone")}
            >
              <Text
                style={[
                  styles.presetPillText,
                  locationDetails.city.toLowerCase() === "puducherry" && styles.presetPillTextActive,
                ]}
              >
                📍 Puducherry
              </Text>
            </TouchableOpacity>
          </View>

          {/* Editable City, District, Ward Inputs */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subInputLabel}>City / Town</Text>
              <TextInput
                style={styles.textInput}
                value={locationDetails.city}
                onChangeText={(val) =>
                  setLocationDetails((prev) => ({ ...prev, city: val }))
                }
                placeholder="e.g. Villupuram"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.subInputLabel}>District</Text>
              <TextInput
                style={styles.textInput}
                value={locationDetails.district}
                onChangeText={(val) =>
                  setLocationDetails((prev) => ({ ...prev, district: val }))
                }
                placeholder="e.g. Villupuram"
                placeholderTextColor="#64748b"
              />
            </View>
          </View>

          <Text style={styles.subInputLabel}>Municipal Ward / Zone</Text>
          <TextInput
            style={styles.textInput}
            value={locationDetails.ward}
            onChangeText={(val) =>
              setLocationDetails((prev) => ({ ...prev, ward: val }))
            }
            placeholder="e.g. Ward 1 / East Zone"
            placeholderTextColor="#64748b"
          />

          {/* Main Action Registration Trigger Button */}
          <TouchableOpacity
            style={[
              styles.primarySubmitButton,
              { opacity: isEmailVerified ? 1 : 0.6 },
            ]}
            onPress={handleCreateAccountSubmit}
            disabled={loadingSubmit}
          >
            {loadingSubmit ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEmailVerified ? "Create Account" : "Verify Email First"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onNavigateToLogin}
          style={{ marginTop: 16, marginBottom: 36 }}
        >
          <Text style={{ color: "#94a3b8", textAlign: "center", fontSize: 13 }}>
            Already a registered citizen?{" "}
            <Text style={{ color: civicTheme.colors.civicBlueLight, fontWeight: "700" }}>
              Sign In Here
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#060d19" },
  scrollFrame: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.8,
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  statusBannerBox: {
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
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  formCard: {
    backgroundColor: "rgba(17, 34, 64, 0.85)",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    ...civicTheme.shadows.card,
  },
  inputLabel: {
    color: civicTheme.colors.civicBlueLight,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subInputLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: "rgba(10, 25, 47, 0.8)",
    color: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    fontSize: 14,
    marginBottom: 14,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  inlineButton: {
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 110,
    ...civicTheme.shadows.subtle,
  },
  inlineButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  otpCard: {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  otpInstructions: {
    color: "#e2e8f0",
    fontSize: 12,
    marginBottom: 10,
    fontWeight: "600",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 14,
  },
  autoDetectPill: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  presetPill: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  presetPillActive: {
    backgroundColor: "rgba(14, 116, 144, 0.4)",
    borderColor: "#38bdf8",
  },
  presetPillText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  presetPillTextActive: {
    color: "#38bdf8",
    fontWeight: "700",
  },
  primarySubmitButton: {
    backgroundColor: civicTheme.colors.civicBlue,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    ...civicTheme.shadows.subtle,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});