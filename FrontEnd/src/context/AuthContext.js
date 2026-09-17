import React, { createContext, useState, useContext } from "react";
import { Alert } from "react-native";
import {
  loginCitizen,
  registerCitizen as apiRegisterCitizen,
} from "../api/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Stores logged-in session profile data
  const [userRole, setUserRole] = useState(null); // 🎯 Added: Shares role tracking with App.js routing gates
  const [isRegistering, setIsRegistering] = useState(false); // Controls toggle between screens

  // 🔐 HANDLE LIVE USER LOGIN
  // Updated to accept the direct backend response object or text fields gracefully
  const loginUser = async (emailOrResponse, password) => {
    // Scenario A: If passed an object directly from LoginScreen's Axios handler
    // (also used right after registration, since the register response carries
    // the same shape plus city/district/ward).
    if (typeof emailOrResponse === "object" && emailOrResponse !== null) {
      const userData = emailOrResponse;
      setUser({
        id: userData.userId,
        name: userData.name,
        email: userData.email,
        city: userData.city || "",
        district: userData.district || "",
        ward: userData.ward || "",
      });
      // Standardize role to lowercase to match your App.js router switch ('officer' vs default dashboard)
      setUserRole(userData.role ? userData.role.toLowerCase() : "citizen");
      return;
    }

    // Scenario B: If fallback usage calls loginUser("email", "password") directly
    try {
      const result = await loginCitizen(emailOrResponse, password);

      if (result.error) {
        throw new Error(result.error);
      } else {
        setUser({
          id: result.userId,
          name: result.name,
          email: result.email,
          city: result.city || "",
          district: result.district || "",
          ward: result.ward || "",
        });
        setUserRole(result.role ? result.role.toLowerCase() : "citizen");
        Alert.alert(
          "Welcome Back!",
          `Logged in successfully as ${result.name}`,
        );
      }
    } catch (err) {
      throw new Error(err.message);
    }
  };

  // 🔑 HANDLE LIVE USER REGISTRATION
  const registerUser = async (userPayload) => {
    try {
      const result = await apiRegisterCitizen(userPayload);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.message === "User registered successfully!" || result.userId) {
        Alert.alert("Success", "Account created successfully! Please sign in.");
        setIsRegistering(false);
      } else {
        throw new Error(
          "Registration failed due to an unknown database response.",
        );
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  // 🚪 LOGOUT ACTION
  const logoutUser = () => {
    setUser(null);
    setUserRole(null); // Clean up roles on session close
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole, // 🚀 Exposed to clear the gatekeeping if statements in App.js
        isRegistering,
        setIsRegistering,
        loginUser,
        registerCitizen: registerUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
