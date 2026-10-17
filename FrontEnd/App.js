import React, { useState, Component } from "react";
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// 🔐 Authentication Context Imports
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";

// 📱 Dashboard & Screen Layout Imports
import HomeScreen from "./src/screens/HomeScreen";
import GrievancesScreen from "./src/screens/GrievancesScreen";
import DepartmentsScreen from "./src/screens/DepartmentsScreen";
import AccountScreen from "./src/screens/AccountScreen";

// 🏢 New Real Officer Dashboard Import (Your Friend's Tab Structure)
import OfficerDashboard from "./src/screens/officer/OfficerDashboard";
// 🧭 Supervisor Console Import — routes unassigned/escalated tickets to a human
import SupervisorDashboard from "./src/screens/supervisor/SupervisorDashboard";

// 🗺️ New Interactive Screen Imports
import MapExplorerScreen from "./src/screens/MapExplorerScreen";
import FileGrievanceScreen from "./src/screens/FileGrievanceScreen";
import DepartmentFeedScreen from "./src/screens/DepartmentFeedScreen";

// 👤 Profile Sub-Screens Layer
import {
  EditProfileScreen,
  PrivacySecurityScreen,
} from "./src/screens/ProfileSubScreens";
import FeedbackScreen from "./src/screens/FeedbackScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import NotificationBell from "./src/components/NotificationBell";

import { styles } from "./src/styles/globalStyles";
import { civicTheme } from "./src/styles/civicTheme";

// ==========================================
// 👤 MAIN CITIZEN DASHBOARD (Authenticated View Layer)
// ==========================================
function UserDashboard() {
  const [currentScreen, setCurrentScreen] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sharedLocation, setSharedLocation] = useState(null);
  const { logoutUser, user } = useAuth();

  // 🔌 Navigation Router Engine
  const customNavigate = (screenName, params) => {
    if (params?.category) {
      setSelectedCategory(params.category);
    }
    setCurrentScreen(screenName);
  };

  const renderScreenContent = () => {
    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            navigate={customNavigate}
            setSharedLocation={setSharedLocation}
            currentUserId={user?.id}
          />
        );
      case "departments":
        return (
          <DepartmentsScreen
            navigate={(dest, params) => customNavigate(dest, params)}
            navigation={{ navigate: customNavigate }}
          />
        );
      case "department-feed":
        return (
          <DepartmentFeedScreen
            route={{ params: { category: selectedCategory } }}
            navigation={{ goBack: () => setCurrentScreen("departments") }}
            currentUserId={user?.id}
          />
        );
      case "grievances":
        return <GrievancesScreen currentUserId={user?.id} />;

      case "account":
        return (
          <AccountScreen
            onLogout={logoutUser}
            userEmail={user?.email}
            userName={user?.name}
            currentUserId={user?.id}
            userCity={user?.city}
            userDistrict={user?.district}
            userWard={user?.ward}
            navigation={{ navigate: customNavigate }}
          />
        );
      case "edit-profile":
        return (
          <EditProfileScreen
            userEmail={user?.email}
            onBack={() => setCurrentScreen("account")}
          />
        );
      case "privacy-security":
        return (
          <PrivacySecurityScreen onBack={() => setCurrentScreen("account")} />
        );
      case "app-feedback":
        return (
          <FeedbackScreen
            userEmail={user?.email}
            onBack={() => setCurrentScreen("account")}
          />
        );

      case "notifications":
        return (
          <NotificationsScreen
            userId={user?.id}
            onBack={() => setCurrentScreen("home")}
          />
        );

      case "mapExplorer":
        return (
          <MapExplorerScreen
            navigate={customNavigate}
            userLocation={sharedLocation}
            currentUserId={user?.id}
            setSharedLocation={setSharedLocation}
          />
        );
      case "fileGrievance":
        return (
          <FileGrievanceScreen
            navigate={customNavigate}
            userLocation={sharedLocation}
            currentUserId={user?.id}
          />
        );

      default:
        return (
          <HomeScreen
            navigate={customNavigate}
            setSharedLocation={setSharedLocation}
          />
        );
    }
  };

  const isFullscreenView = [
    "mapExplorer",
    "fileGrievance",
    "department-feed",
    "edit-profile",
    "privacy-security",
    "app-feedback",
    "notifications",
  ].includes(currentScreen);

  return (
    <LinearGradient
      colors={civicTheme.colors.gradients.officialNavy}
      style={styles.appViewContainer}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView
        style={[styles.appSafeAreaFrame, { flex: 1 }]}
      >
        <View style={{ flex: 1 }}>{renderScreenContent()}</View>

        {!isFullscreenView && (
          <View style={styles.navigationTabBarBase}>
            <TouchableOpacity
              style={styles.tabBarButton}
              onPress={() => customNavigate("home")}
            >
              <Ionicons
                name="home"
                size={20}
                color={currentScreen === "home" ? civicTheme.colors.civicBlueLight : "#94a3b8"}
              />
              <Text
                style={[
                  styles.tabBarLabelText,
                  { color: currentScreen === "home" ? civicTheme.colors.civicBlueLight : "#94a3b8" },
                ]}
              >
                Home
              </Text>
              {currentScreen === "home" && (
                <View style={styles.tabActiveBarPointer} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBarButton}
              onPress={() => customNavigate("grievances")}
            >
              <Ionicons
                name="folder-open"
                size={20}
                color={currentScreen === "grievances" ? civicTheme.colors.civicBlueLight : "#94a3b8"}
              />
              <Text
                style={[
                  styles.tabBarLabelText,
                  {
                    color:
                      currentScreen === "grievances" ? civicTheme.colors.civicBlueLight : "#94a3b8",
                  },
                ]}
              >
                Grievances
              </Text>
              {currentScreen === "grievances" && (
                <View style={styles.tabActiveBarPointer} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBarButton}
              onPress={() => customNavigate("departments")}
            >
              <Ionicons
                name="grid"
                size={20}
                color={
                  ["departments", "department-feed"].includes(currentScreen)
                    ? civicTheme.colors.civicBlueLight
                    : "#94a3b8"
                }
              />
              <Text
                style={[
                  styles.tabBarLabelText,
                  {
                    color: ["departments", "department-feed"].includes(
                      currentScreen,
                    )
                      ? civicTheme.colors.civicBlueLight
                      : "#94a3b8",
                  },
                ]}
              >
                Departments
              </Text>
              {["departments", "department-feed"].includes(currentScreen) && (
                <View style={styles.tabActiveBarPointer} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tabBarButton}
              onPress={() => customNavigate("account")}
            >
              <Ionicons
                name="person"
                size={20}
                color={
                  [
                    "account",
                    "edit-profile",
                    "privacy-security",
                    "app-feedback",
                  ].includes(currentScreen)
                    ? civicTheme.colors.civicBlueLight
                    : "#94a3b8"
                }
              />
              <Text
                style={[
                  styles.tabBarLabelText,
                  {
                    color: [
                      "account",
                      "edit-profile",
                      "privacy-security",
                      "app-feedback",
                    ].includes(currentScreen)
                      ? civicTheme.colors.civicBlueLight
                      : "#94a3b8",
                  },
                ]}
              >
                Account
              </Text>
              {[
                "account",
                "edit-profile",
                "privacy-security",
                "app-feedback",
              ].includes(currentScreen) && (
                <View style={styles.tabActiveBarPointer} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

// ==========================================
// 🛣️ NAVIGATION ROOT (Handles Gatekeeping & Auth Toggling)
// ==========================================
function NavigationRoot() {
  // Pulls tracking values out of context engine
  const { user, userRole, loading, loginUser, registerUser } = useAuth();

  // Manage local toggle state for unauthenticated views
  const [authScreen, setAuthScreen] = useState("login");

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#319795" />
      </View>
    );
  }

  // If the citizen isn't validated via context, render auth gates
  if (!user) {
    return authScreen === "register" ? (
      <RegisterScreen
        onNavigateToLogin={() => setAuthScreen("login")}
        registerUser={(mockUserData) => {
          if (registerUser) {
            registerUser(mockUserData);
          } else if (loginUser) {
            loginUser(mockUserData);
          } else {
            setAuthScreen("login");
          }
        }}
      />
    ) : (
      <LoginScreen
        onNavigateToRegister={() => setAuthScreen("register")}
        loginUser={(userData) => {
          if (loginUser) {
            loginUser(userData);
          } else {
            console.warn(
              "AuthContext connection failed. Check useAuth initialization.",
            );
          }
        }}
      />
    );
  }

  // 🎯 FIX: Normalizing strings using toUpperCase() to safely intercept "FIELD_OFFICER" database signals
  const currentNormalizedRole = userRole?.toUpperCase() || "";

  if (currentNormalizedRole === "FIELD_OFFICER") {
    return <OfficerDashboard />;
  }

  if (currentNormalizedRole === "SUPERVISOR") {
    return <SupervisorDashboard />;
  }

  return <UserDashboard />;
}

// ==========================================
// 🛡️ ERROR BOUNDARY (Prevents white blank screens on unhandled errors)
// ==========================================
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("CivicSync Error Boundary Caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#060d19",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Text
            style={{
              color: "#ef4444",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Interface Encountered An Issue
          </Text>
          <Text
            style={{
              color: "#94a3b8",
              fontSize: 13,
              textAlign: "center",
              marginBottom: 20,
              maxWidth: 400,
            }}
          >
            {this.state.error?.message || "Unexpected exception during render."}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#0284c7",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
              Reload Screen
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 🏢 APP ROOT ENTRY POINT
// ==========================================
export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <NavigationRoot />
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}