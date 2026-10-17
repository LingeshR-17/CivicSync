import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { civicTheme } from '../../styles/civicTheme';
import { DEFAULT_INDIA_LOCATION } from '../../config/env';
import { reverseGeocodeIndianAddress, searchIndianLocations } from '../../api/api';

/**
 * 📍 LocationPinPicker3D: Production-grade 3D Location Picker for India
 * Features:
 * - Indian Location Search with autocomplete (streets, wards, landmarks, PIN codes)
 * - Center-Reticle Crosshairs Pinning (pan the map under the pin - zero struggle)
 * - Real-Time Indian Reverse Geocoding (Door/Street, Ward, Suburb, City, PIN)
 * - 3D Perspective Tilt (0° to 55°) & Satellite Hybrid mode
 * - "Locate Me" High-Accuracy GPS trigger
 */
export default function LocationPinPicker3D({
  initialLocation,
  onLocationSelected,
  height = 300,
}) {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const [currentCoords, setCurrentCoords] = useState(
    initialLocation
      ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude }
      : { latitude: DEFAULT_INDIA_LOCATION.latitude, longitude: DEFAULT_INDIA_LOCATION.longitude }
  );

  // Listen for Web messages when running in desktop browser
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onWebMsg = (e) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (data && data.type === 'PIN_MOVED') {
            const nextCoords = { latitude: data.latitude, longitude: data.longitude };
            setCurrentCoords(nextCoords);
            resolveAddress(data.latitude, data.longitude);
          }
        } catch (_) {}
      };
      window.addEventListener('message', onWebMsg);
      return () => window.removeEventListener('message', onWebMsg);
    }
  }, []);

  const [addressDetails, setAddressDetails] = useState({
    street: 'Fetching street...',
    ward: 'Detecting ward...',
    city: 'Detecting city...',
    pincode: '',
    formattedAddress: 'Determining exact administrative boundary...',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [currentLayer, setCurrentLayer] = useState('smart_city_3d');

  // Trigger reverse geocoding when coordinates change
  const resolveAddress = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const res = await reverseGeocodeIndianAddress(lat, lng);
      setAddressDetails(res);
      if (onLocationSelected) {
        onLocationSelected({
          latitude: lat,
          longitude: lng,
          ...res,
        });
      }
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  useEffect(() => {
    resolveAddress(currentCoords.latitude, currentCoords.longitude);
  }, []);

  // HTML template for the 3D Pin Picker with crosshair target reticle
  const generatePickerHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #060d19; overflow: hidden; }

    /* Center Crosshairs & Pin Reticle */
    .center-reticle-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      pointer-events: none;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .reticle-pin {
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      background: #0284c7;
      border: 3px solid #ffffff;
      box-shadow: 0 8px 16px rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.15s ease-out;
    }
    .reticle-pin.moving {
      transform: rotate(-45deg) translateY(-8px);
      background: #38bdf8;
    }
    .reticle-dot {
      width: 10px;
      height: 10px;
      background: #ffffff;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .reticle-shadow {
      width: 14px;
      height: 6px;
      background: rgba(0,0,0,0.4);
      border-radius: 50%;
      margin-top: 2px;
    }
    .maplibregl-ctrl-bottom-right, .maplibregl-ctrl-bottom-left { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="center-reticle-container">
    <div id="pinEl" class="reticle-pin">
      <div class="reticle-dot"></div>
    </div>
    <div class="reticle-shadow"></div>
  </div>

  <script>
    let map;
    let currentPitch = 50;

    const styles = {
      smart_city_3d: {
        version: 8,
        sources: {
          'dark-base': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri, HERE, Garmin'
          },
          'dark-labels': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          { id: 'dark-base-layer', type: 'raster', source: 'dark-base', minzoom: 0, maxzoom: 19 },
          { id: 'dark-labels-layer', type: 'raster', source: 'dark-labels', minzoom: 0, maxzoom: 19 }
        ]
      },
      satellite_hybrid: {
        version: 8,
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri, Maxar, Earthstar Geographics'
          },
          'esri-labels': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256
          }
        },
        layers: [
          { id: 'satellite-layer', type: 'raster', source: 'esri-satellite', minzoom: 0, maxzoom: 19 },
          { id: 'labels-layer', type: 'raster', source: 'esri-labels', minzoom: 0, maxzoom: 19 }
        ]
      },
      municipal_topo: {
        version: 8,
        sources: {
          'osm-standard': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{ id: 'osm-layer', type: 'raster', source: 'osm-standard', minzoom: 0, maxzoom: 19 }]
      }
    };

    function initMap() {
      map = new maplibregl.Map({
        container: 'map',
        style: styles.smart_city_3d,
        center: [${currentCoords.longitude}, ${currentCoords.latitude}],
        zoom: 16.2,
        pitch: currentPitch,
        bearing: -10,
        antialias: true
      });

      const pinEl = document.getElementById('pinEl');

      map.on('movestart', () => {
        pinEl.classList.add('moving');
      });

      map.on('moveend', () => {
        pinEl.classList.remove('moving');
        const center = map.getCenter();
        postToNative({
          type: 'PIN_MOVED',
          latitude: center.lat,
          longitude: center.lng
        });
      });

      // Allow clicking on any road, street, or place to drop/fly the pin there
      map.on('click', (e) => {
        map.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], duration: 500 });
      });
    }

    function postToNative(data) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else {
        window.parent.postMessage(JSON.stringify(data), '*');
      }
    }

    window.handleNativeCommand = function(cmd) {
      if (!map) return;
      if (cmd.type === 'FLY_TO') {
        map.flyTo({ center: [cmd.longitude, cmd.latitude], zoom: 16.5, pitch: currentPitch, duration: 1000 });
      } else if (cmd.type === 'CHANGE_LAYER') {
        map.setStyle(styles[cmd.layer] || styles.smart_city_3d);
      } else if (cmd.type === 'TOGGLE_3D') {
        currentPitch = cmd.is3D ? 50 : 0;
        map.easeTo({ pitch: currentPitch, duration: 700 });
      }
    };

    window.onload = initMap;
  </script>
</body>
</html>`;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'PIN_MOVED') {
        const nextCoords = { latitude: data.latitude, longitude: data.longitude };
        setCurrentCoords(nextCoords);
        resolveAddress(data.latitude, data.longitude);
      }
    } catch (err) {
      console.warn('Picker message error:', err);
    }
  };

  const sendCommand = (cmd) => {
    if (Platform.OS === 'web') {
      if (iframeRef.current && iframeRef.current.contentWindow && iframeRef.current.contentWindow.handleNativeCommand) {
        iframeRef.current.contentWindow.handleNativeCommand(cmd);
      }
      return;
    }
    const js = `if (window.handleNativeCommand) { window.handleNativeCommand(${JSON.stringify(cmd)}); } true;`;
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(js);
    }
  };

  // Indian Address Search Handler
  const handleSearchTextChange = (text) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (text.trim().length >= 3) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchIndianLocations(text);
        setSearchResults(results);
        setIsSearching(false);
      }, 400);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const nextCoords = { latitude: result.latitude, longitude: result.longitude };
    setCurrentCoords(nextCoords);
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    sendCommand({ type: 'FLY_TO', latitude: result.latitude, longitude: result.longitude });
    resolveAddress(result.latitude, result.longitude);
  };

  // GPS "Locate Me" Button
  const handleLocateMe = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setCurrentCoords(nextCoords);
      sendCommand({ type: 'FLY_TO', latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      resolveAddress(loc.coords.latitude, loc.coords.longitude);
    } catch (err) {
      console.warn('GPS Locate Me error:', err);
    }
  };

  // Toggle 3D Perspective
  const handleToggle3D = () => {
    const nextState = !is3D;
    setIs3D(nextState);
    sendCommand({ type: 'TOGGLE_3D', is3D: nextState });
  };

  // Cycle Layer
  const handleCycleLayer = () => {
    const layers = ['smart_city_3d', 'satellite_hybrid', 'municipal_topo'];
    const nextIndex = (layers.indexOf(currentLayer) + 1) % layers.length;
    const nextLayer = layers[nextIndex];
    setCurrentLayer(nextLayer);
    sendCommand({ type: 'CHANGE_LAYER', layer: nextLayer });
  };

  return (
    <View style={localStyles.wrapper}>
      {/* 🔍 Top Indian Search Bar Button */}
      <TouchableOpacity
        style={localStyles.searchBarTrigger}
        onPress={() => setShowSearchModal(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={16} color={civicTheme.colors.civicBlueLight} style={{ marginRight: 8 }} />
        <Text style={localStyles.searchPlaceholder} numberOfLines={1}>
          Search Indian street, ward, landmark, PIN code...
        </Text>
      </TouchableOpacity>

      {/* 🗺️ 3D Map Container */}
      <View style={[localStyles.mapBox, { height }]}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={generatePickerHtml()}
            style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#060d19' }}
            title="Location Pin Picker 3D"
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: generatePickerHtml() }}
            onMessage={handleWebViewMessage}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            style={localStyles.mapView}
          />
        )}

        {/* Floating Controls */}
        <View style={localStyles.floatingControls}>
          <TouchableOpacity style={localStyles.iconButton} onPress={handleLocateMe}>
            <Ionicons name="locate" size={18} color={civicTheme.colors.civicBlueLight} />
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.iconButton} onPress={handleToggle3D}>
            <Text style={[localStyles.control3dText, { color: is3D ? civicTheme.colors.civicBlueLight : '#94a3b8' }]}>
              {is3D ? '3D' : '2D'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={localStyles.iconButton} onPress={handleCycleLayer}>
            <Ionicons
              name={currentLayer === 'satellite_hybrid' ? 'planet' : currentLayer === 'municipal_topo' ? 'map' : 'business'}
              size={16}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        {/* Center reticle indicator label */}
        <View style={localStyles.reticleHint}>
          <Text style={localStyles.reticleHintText}>Move map to align target pin</Text>
        </View>
      </View>

      {/* 🏛️ Live Indian Administrative Address Verification Card */}
      <View style={localStyles.addressCard}>
        <View style={localStyles.addressHeaderRow}>
          <View style={localStyles.addressIconBadge}>
            <Ionicons name="location-sharp" size={16} color={civicTheme.colors.civicBlueLight} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={localStyles.streetText} numberOfLines={1}>
              {addressDetails.street || 'Municipal Location'}
            </Text>
            <Text style={localStyles.wardText} numberOfLines={1}>
              {addressDetails.ward} • {addressDetails.city} {addressDetails.pincode ? `(${addressDetails.pincode})` : ''}
            </Text>
          </View>
          {isReverseGeocoding ? (
            <ActivityIndicator size="small" color={civicTheme.colors.civicBlueLight} />
          ) : (
            <View style={localStyles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={localStyles.verifiedText}>Geo-Tagged</Text>
            </View>
          )}
        </View>
      </View>

      {/* 🔍 Fullscreen Search Modal for Indian Places */}
      <Modal visible={showSearchModal} animationType="slide" transparent onRequestClose={() => setShowSearchModal(false)}>
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <View style={localStyles.modalHeader}>
              <Ionicons name="search" size={20} color={civicTheme.colors.civicBlueLight} style={{ marginRight: 8 }} />
              <TextInput
                style={localStyles.modalInput}
                placeholder="Search street, ward, city, PIN in India..."
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={handleSearchTextChange}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowSearchModal(false)} style={localStyles.closeBtn}>
                <Ionicons name="close-circle" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {isSearching && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={civicTheme.colors.civicBlueLight} />
                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 8 }}>Searching Indian Administrative Database...</Text>
              </View>
            )}

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity style={localStyles.resultItem} onPress={() => handleSelectSearchResult(item)}>
                  <Ionicons name="navigate-circle-outline" size={20} color={civicTheme.colors.civicBlueLight} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={localStyles.resultTitle} numberOfLines={1}>{item.shortTitle}</Text>
                    <Text style={localStyles.resultDesc} numberOfLines={1}>{item.displayName}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !isSearching && searchQuery.length >= 3 ? (
                  <Text style={localStyles.noResultsText}>No Indian locations found matching "{searchQuery}"</Text>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  wrapper: {
    marginVertical: 10,
  },
  searchBarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 34, 64, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchPlaceholder: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
  },
  mapBox: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#060d19',
    position: 'relative',
  },
  mapView: {
    flex: 1,
    backgroundColor: '#060d19',
  },
  floatingControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 8,
    zIndex: 20,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 25, 47, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  control3dText: {
    fontSize: 12,
    fontWeight: '800',
  },
  reticleHint: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(6, 13, 25, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
  },
  reticleHintText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  addressCard: {
    marginTop: 8,
    backgroundColor: 'rgba(17, 34, 64, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 12,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streetText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  wardText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 13, 25, 0.85)',
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#0a192f',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 34, 64, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  modalInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  closeBtn: {
    padding: 4,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  resultDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  noResultsText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
  },
});
