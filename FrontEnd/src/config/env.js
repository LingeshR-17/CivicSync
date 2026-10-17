// 🏛️ CivicSync Centralized Configuration & Environment Variables
import { Platform } from 'react-native';

/**
 * Configure your active backend server address here.
 * For Android Emulator: "http://10.0.2.2:8080"
 * For iOS Simulator or Web: "http://localhost:8080"
 * For Physical Device over Wi-Fi: Replace with your machine's LAN IP (e.g. "http://192.168.0.4:8080")
 */
const DEFAULT_LOCAL_IP = "192.168.0.4"; // Change to your local Wi-Fi IP or leave for local network

export const SERVER_ORIGIN =
  Platform.OS === 'web'
    ? 'http://localhost:8080'
    : (Platform.OS === 'android' ? `http://${DEFAULT_LOCAL_IP}:8080` : 'http://localhost:8080');

export const API_ENDPOINTS = {
  grievances: `${SERVER_ORIGIN}/api/grievances`,
  auth: `${SERVER_ORIGIN}/api/auth`,
  officer: `${SERVER_ORIGIN}/api/v1/officer`,
  supervisor: `${SERVER_ORIGIN}/api/v1/supervisor`,
  notifications: `${SERVER_ORIGIN}/api/notifications`,
};

// 🇮🇳 Default Geographic Center for India (Tamil Nadu / South Zone default, can be set to any Indian city)
export const DEFAULT_INDIA_LOCATION = {
  latitude: 11.9344,
  longitude: 79.4947,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
  city: "Villupuram",
  state: "Tamil Nadu",
  country: "India",
};

// 🗺️ Official Government & Smart City Map GIS Tile Styles
export const MAP_STYLES = {
  SMART_CITY_3D: 'smart_city_3d',      // 3D Dark Municipal GIS with building extrusions
  SATELLITE_HYBRID: 'satellite_hybrid', // High-res Indian Satellite imagery with road/ward vectors
  MUNICIPAL_TOPO: 'municipal_topo',    // Standard Survey of India & Municipal ward topo
};

// 📍 Indian Geocoding & Reverse Geocoding Services
export const GEOCODING_CONFIG = {
  NOMINATIM_REVERSE: 'https://nominatim.openstreetmap.org/reverse',
  NOMINATIM_SEARCH: 'https://nominatim.openstreetmap.org/search',
  COUNTRY_CODES: 'in', // Filter searches specifically to India
};
