import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🎯 Import storage engine
import { FontAwesome5, Entypo, Ionicons } from '@expo/vector-icons';
import { styles, colors } from '../styles/globalStyles';
import { fetchGrievances, getMediaUrl } from '../api/api';
import UpvoteButton from '../components/UpvoteButton';
import StatusProgressSteps from '../components/StatusProgressSteps';

// 🎯 Relational Database ID to Visual Layout Mapping Directory (same map used on
// the Grievances page, so department icons/names look identical everywhere)
const DB_DEPARTMENT_MAP = {
  1: { name: "Sanitation", icon: "trash-alt" },
  2: { name: "Electricity", icon: "lightbulb" },
  3: { name: "Water Supply", icon: "faucet" },
  4: { name: "Roads & Bridges", icon: "road" },
  5: { name: "Public Health", icon: "heartbeat" },
  6: { name: "Education", icon: "graduation-cap" },
  7: { name: "Transport", icon: "bus" },
  8: { name: "Sewage & Drains", icon: "water" }
};

const getDeptInfo = (deptId) => DB_DEPARTMENT_MAP[deptId] || { name: "General", icon: null };

export default function DepartmentFeedScreen({ route, navigation, currentUserId, ...props }) {
  const [categoryName, setCategoryName] = useState("Department");
  const [nearbyTickets, setNearbyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null); // 🖼️ Full-screen photo evidence viewer

  useEffect(() => {
    const loadDataAndFilter = async () => {
      try {
        setLoading(true);

        // 1. Get the department selection value saved by the previous screen click event
        let selectedDept = route?.params?.categoryName || props?.categoryName;

        if (!selectedDept) {
          selectedDept = await AsyncStorage.getItem('SELECTED_DEPT_NAME');
        }

        const finalDeptName = selectedDept || "Sanitation";
        setCategoryName(finalDeptName);

        // 2. Query your Spring Boot backend service
        const masterDatabaseDump = await fetchGrievances(currentUserId);

        // 3. Complete string-to-string case-insensitive match filter mapping
        const filteredResults = (masterDatabaseDump || []).filter(ticket => {
          let ticketDeptString = "";

          if (typeof ticket.department === 'string') {
            ticketDeptString = ticket.department;
          } else if (ticket.department && typeof ticket.department === 'object') {
            ticketDeptString = ticket.department.name || "";
          }

          return ticketDeptString.trim().toLowerCase() === finalDeptName.trim().toLowerCase();
        });

        setNearbyTickets(filteredResults);

      } catch (error) {
        console.error("Failed loading data routing components:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDataAndFilter();
  }, []);

  const handleBackPress = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    } else if (props.navigate) {
      props.navigate('departments');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#07161b', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#a5f3fc" />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { backgroundColor: '#07161b' }]}>
      <View style={styles.screenHeaderWithBack}>
        <TouchableOpacity onPress={handleBackPress} style={{ paddingRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.centeredScreenTitle, { flex: 1, textTransform: 'uppercase' }]}>{categoryName} FEED</Text>
      </View>

      <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20, fontWeight: '500', paddingHorizontal: 4 }}>
        Displaying civic incidents active under the <Text style={{ color: colors.accent }}>{categoryName}</Text> branch structure.
      </Text>

      {nearbyTickets.length === 0 ? (
        <View style={{ marginTop: 60, alignItems: 'center', paddingHorizontal: 20 }}>
          <Ionicons name="checkmark-circle-outline" size={50} color="#4ade80" style={{ marginBottom: 12 }} />
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center' }}>All Clear!</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4, opacity: 0.8 }}>
            No active {categoryName.toLowerCase()} issues have been found in the live registry.
          </Text>
        </View>
      ) : (
        nearbyTickets.map((ticket) => {
          // Normalizes status strings from the backend database checks (PENDING/Pending or SOLVED/Solved)
          const normalizedStatus = (ticket.status || "Pending").toUpperCase();
          const dynamicColor =
            normalizedStatus === "CLOSED" || normalizedStatus === "SOLVED" ? "#4ade80"
            : normalizedStatus === "RESOLVED" ? "#38bdf8"
            : normalizedStatus === "REOPENED_BY_CITIZEN" ? "#f97316"
            : normalizedStatus === "PENDING" ? "#ef4444"
            : "#fbbf24";

          // Extracts the target field from your Java Entity layer cleanly
          const deptId = ticket.departmentId !== undefined ? ticket.departmentId : ticket.department_id;
          const deptInfo = getDeptInfo(deptId);

          return (
            <View key={ticket.id.toString()} style={localStyles.ticketCard}>
              {/* 🎯 Department icon lives in its own header row, above the ticket
                  reference number, so a long ticket number can never push it off the card. */}
              <View style={localStyles.deptHeaderRow}>
                <View style={[localStyles.deptIconCircle, { backgroundColor: dynamicColor + '22', borderColor: dynamicColor + '55' }]}>
                  {deptInfo.icon ? (
                    <FontAwesome5 name={deptInfo.icon} size={14} color={dynamicColor} />
                  ) : (
                    <Entypo name="location" size={14} color={dynamicColor} />
                  )}
                </View>
                <Text style={localStyles.deptNameText} numberOfLines={1}>{deptInfo.name}</Text>

                <View style={[localStyles.statusChip, { backgroundColor: dynamicColor + '22' }]}>
                  <View style={[localStyles.statusDot, { backgroundColor: dynamicColor }]} />
                  <Text style={[localStyles.statusChipText, { color: dynamicColor }]}>
                    {normalizedStatus === 'REOPENED_BY_CITIZEN' ? 'Reopened' : normalizedStatus.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={localStyles.refNumberRow}>
                <View style={localStyles.refNumberBadge}>
                  <Ionicons name="shield-checkmark" size={11} color={colors.accent} />
                  <Text style={localStyles.refNumberText} numberOfLines={1}>
                    {ticket.ticketNumber || ticket.ticket_number || `CR-${ticket.id}`}
                  </Text>
                </View>
              </View>

              {/* 🎯 3-dot Filed -> Assigned -> Fixed line instead of a raw
                  status string or bare percentage — readable at a glance. */}
              <StatusProgressSteps status={ticket.status} color={dynamicColor} />

              <Text style={localStyles.titleText} numberOfLines={1}>{ticket.title}</Text>
              <Text style={localStyles.descText} numberOfLines={2}>{ticket.description}</Text>

              {/* 🎯 Where the issue was filed, so citizens can judge relevance before upvoting */}
              {ticket.formattedAddress ? (
                <View style={localStyles.locationRow}>
                  <Ionicons name="location-sharp" size={14} color={colors.accent} />
                  <Text style={localStyles.locationText} numberOfLines={2}>
                    {ticket.formattedAddress}
                  </Text>
                </View>
              ) : null}

              {/* 🎯 Photo evidence: shown right above the upvote action */}
              {ticket.imageUrl ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPreviewImage(getMediaUrl(ticket.imageUrl))}
                  style={localStyles.evidenceWrapper}
                >
                  <Image
                    source={{ uri: getMediaUrl(ticket.imageUrl) }}
                    style={localStyles.evidenceImage}
                    resizeMode="cover"
                  />
                  <View style={localStyles.evidenceBadge}>
                    <Ionicons name="expand" size={12} color="#fff" />
                    <Text style={localStyles.evidenceBadgeText}>Photo Evidence</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              <View style={localStyles.cardFooter}>
                <UpvoteButton grievanceItem={ticket} currentCitizenId={currentUserId} />
              </View>
            </View>
          );
        })
      )}

      {/* 🖼️ Full-screen photo evidence viewer */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <Pressable style={localStyles.previewOverlay} onPress={() => setPreviewImage(null)}>
          <Image source={{ uri: previewImage }} style={localStyles.previewImage} resizeMode="contain" />
          <TouchableOpacity style={localStyles.previewCloseBtn} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// 🎯 Same card look-and-feel as GrievancesScreen's ticketCard, so a ticket looks
// identical whether you find it on "My Grievances" or inside a Department feed.
const localStyles = StyleSheet.create({
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 16,
    marginBottom: 16,
  },
  deptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deptIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  deptNameText: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  refNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  refNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(165,243,252,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(165,243,252,0.25)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 5,
    flexShrink: 1,
  },
  refNumberText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: 'monospace',
  },
  titleText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  descText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  locationText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  evidenceWrapper: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  evidenceImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  evidenceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  evidenceBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
