import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Image, Modal, Pressable, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Entypo, Ionicons } from '@expo/vector-icons';
import { styles, colors } from '../styles/globalStyles';
import { fetchGrievances, getMediaUrl, confirmResolution } from '../api/api';
import UpvoteButton from '../components/UpvoteButton';
import StatusProgressSteps from '../components/StatusProgressSteps';
import { TextInput } from 'react-native';

// 🎯 Relational Database ID to Visual Layout Mapping Directory
const DB_DEPARTMENT_MAP = {
  1: { name: "Sanitation", icon: "trash-alt" },
  2: { name: "Electricity", icon: "lightbulb" },
  3: { name: "Water Supply", icon: "faucet" },
  4: { name: "Roads & Bridges", icon: "road" }, // Maps 'Roadways' (ID 4) to UI name
  5: { name: "Public Health", icon: "heartbeat" },
  6: { name: "Education", icon: "graduation-cap" },
  7: { name: "Transport", icon: "bus" },
  8: { name: "Sewage & Drains", icon: "water" }
};

export default function GrievancesScreen({ currentUserId }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('mine'); // 'mine' | 'all'
  const [previewImage, setPreviewImage] = useState(null); // 🎯 Full-screen photo evidence viewer

  // ✅ CITIZEN CONFIRMATION LOOP state
  const [disputeModalTicket, setDisputeModalTicket] = useState(null); // ticket currently being disputed
  const [disputeNote, setDisputeNote] = useState('');
  const [confirmingId, setConfirmingId] = useState(null); // ticket id currently submitting a confirm/dispute call

  const refreshGrievances = async () => {
    try {
      const masterData = await fetchGrievances(currentUserId);
      setComplaints(masterData || []);
    } catch (error) {
      console.error("Error refreshing grievances:", error);
    }
  };

  const handleConfirmFixed = async (ticket) => {
    try {
      setConfirmingId(ticket.id);
      await confirmResolution(ticket.id, currentUserId, true);
      await refreshGrievances();
    } catch (error) {
      console.error("Error confirming fix:", error);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDisputeSubmit = async () => {
    if (!disputeModalTicket) return;
    try {
      setConfirmingId(disputeModalTicket.id);
      await confirmResolution(disputeModalTicket.id, currentUserId, false, disputeNote);
      setDisputeModalTicket(null);
      setDisputeNote('');
      await refreshGrievances();
    } catch (error) {
      console.error("Error disputing resolution:", error);
    } finally {
      setConfirmingId(null);
    }
  };

  // 🎯 UX SIMPLIFICATION: a citizen's proof the government "took" their complaint
  // should look official and be easy to screenshot or forward — a plain ticket
  // number buried in a card doesn't build that trust on its own.
  const handleShareTicket = async (ticket) => {
    const refNumber = ticket.ticketNumber || ticket.ticket_number || `CR-${ticket.id}`;
    try {
      await Share.share({
        message:
          `CivicSync Complaint Receipt\n` +
          `Ticket: ${refNumber}\n` +
          `Issue: ${ticket.title}\n` +
          `Status: ${(ticket.status || 'PENDING').replace(/_/g, ' ')}\n` +
          `Filed via CivicSync — Tamil Nadu civic grievance portal.`,
      });
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  useEffect(() => {
    const fetchUserGrievances = async () => {
      try {
        setLoading(true);
        // 🎯 Pass currentUserId so the backend can flag which cards this citizen upvoted
        const masterData = await fetchGrievances(currentUserId);
        setComplaints(masterData || []);
      } catch (error) {
        console.error("Error reading personal records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserGrievances();
  }, [currentUserId]);

  const getDeptInfo = (deptId) => DB_DEPARTMENT_MAP[deptId] || { name: "General", icon: null };

  const visibleComplaints = filterMode === 'mine' && currentUserId
    ? complaints.filter((c) => c.citizenId === currentUserId)
    : complaints;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07161b' }}>
        <ActivityIndicator size="large" color="#a5f3fc" />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.screenHeaderContainer}>
        <Text style={styles.leftAlignedScreenTitle}>MY GRIEVANCES</Text>
      </View>

      <View style={styles.summaryBannerCard}>
        <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={styles.summaryBannerGradient}>
          <View style={styles.summaryIconBox}>
            <FontAwesome5 name="clipboard-list" size={18} color="#a5f3fc" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.bannerMainTitle}>Complaint Tracking</Text>
            <Text style={styles.bannerSubTitle}>
              {filterMode === 'mine' ? 'Showing your personally reported issues' : 'Showing all community-reported issues'}
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* 🎯 Simple filter toggle so citizens can see just their own tickets or the whole feed */}
      <View style={localStyles.filterRow}>
        <TouchableOpacity
          style={[localStyles.filterPill, filterMode === 'mine' && localStyles.filterPillActive]}
          onPress={() => setFilterMode('mine')}
        >
          <Text style={[localStyles.filterPillText, filterMode === 'mine' && localStyles.filterPillTextActive]}>
            My Tickets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[localStyles.filterPill, filterMode === 'all' && localStyles.filterPillActive]}
          onPress={() => setFilterMode('all')}
        >
          <Text style={[localStyles.filterPillText, filterMode === 'all' && localStyles.filterPillTextActive]}>
            All Issues
          </Text>
        </TouchableOpacity>
      </View>

      {visibleComplaints.length === 0 ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 }}>
          {filterMode === 'mine'
            ? "You haven't submitted any municipal complaints yet."
            : "No community complaints found."}
        </Text>
      ) : (
        visibleComplaints.map((ticket) => {
          // Normalizes status strings from the backend database checks (PENDING/Pending or SOLVED/Solved)
          const normalizedStatus = (ticket.status || "Pending").toUpperCase();
          const dynamicColor =
            normalizedStatus === "CLOSED" || normalizedStatus === "SOLVED" ? "#4ade80"
            : normalizedStatus === "RESOLVED" ? "#38bdf8"
            : normalizedStatus === "REOPENED_BY_CITIZEN" ? "#f97316"
            : normalizedStatus === "PENDING" ? "#ef4444"
            : "#fbbf24";
          const progressPercent =
            normalizedStatus === "CLOSED" || normalizedStatus === "SOLVED" ? "100%"
            : normalizedStatus === "RESOLVED" ? "85%"
            : normalizedStatus === "IN_PROGRESS" || normalizedStatus === "ASSIGNED" || normalizedStatus === "REOPENED_BY_CITIZEN" ? "50%"
            : "15%";
          const isAwaitingMyConfirmation = normalizedStatus === "RESOLVED" && ticket.citizenId === currentUserId;

          // Extracts the target field from your Java Entity layer cleanly
          const deptId = ticket.departmentId !== undefined ? ticket.departmentId : ticket.department_id;
          const deptInfo = getDeptInfo(deptId);

          return (
            <View key={ticket.id.toString()} style={localStyles.ticketCard}>
              {/* 🎯 FIX #3: Department icon now lives in its own header row, above the ticket
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
                <TouchableOpacity
                  style={localStyles.shareBtn}
                  onPress={() => handleShareTicket(ticket)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="share-social-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* 🎯 UX SIMPLIFICATION: 3-dot Filed -> Assigned -> Fixed line instead of a raw
                  status string or bare percentage — readable at a glance for a first-time user. */}
              <StatusProgressSteps status={ticket.status} color={dynamicColor} />

              <Text style={localStyles.titleText} numberOfLines={1}>{ticket.title}</Text>
              <Text style={localStyles.descText} numberOfLines={2}>{ticket.description}</Text>

              {/* 🎯 Grievance details: where the issue was filed, so citizens can judge
                  relevance before upvoting */}
              {ticket.formattedAddress ? (
                <View style={localStyles.locationRow}>
                  <Ionicons name="location-sharp" size={14} color={colors.accent} />
                  <Text style={localStyles.locationText} numberOfLines={2}>
                    {ticket.formattedAddress}
                  </Text>
                </View>
              ) : null}

              {/* 🎯 Photo evidence: shown right above the upvote action so other
                  citizens can see the issue and decide whether to vote */}
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

              {isAwaitingMyConfirmation ? (
                <View style={localStyles.confirmBox}>
                  <View style={localStyles.confirmHeaderRow}>
                    <Ionicons name="help-circle" size={16} color="#38bdf8" />
                    <Text style={localStyles.confirmHeaderText}>The officer marked this as fixed. Is it?</Text>
                  </View>
                  {ticket.completionPhotoUrl ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setPreviewImage(getMediaUrl(ticket.completionPhotoUrl))}
                      style={localStyles.evidenceWrapper}
                    >
                      <Image
                        source={{ uri: getMediaUrl(ticket.completionPhotoUrl) }}
                        style={localStyles.evidenceImage}
                        resizeMode="cover"
                      />
                      <View style={localStyles.evidenceBadge}>
                        <Ionicons name="expand" size={12} color="#fff" />
                        <Text style={localStyles.evidenceBadgeText}>Completion Photo</Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                  <View style={localStyles.confirmButtonRow}>
                    <TouchableOpacity
                      style={[localStyles.confirmBtn, localStyles.confirmBtnYes]}
                      disabled={confirmingId === ticket.id}
                      onPress={() => handleConfirmFixed(ticket)}
                    >
                      {confirmingId === ticket.id ? (
                        <ActivityIndicator size="small" color="#052e16" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#052e16" />
                          <Text style={localStyles.confirmBtnYesText}>Yes, fixed</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[localStyles.confirmBtn, localStyles.confirmBtnNo]}
                      disabled={confirmingId === ticket.id}
                      onPress={() => setDisputeModalTicket(ticket)}
                    >
                      <Ionicons name="close-circle" size={16} color="#fca5a5" />
                      <Text style={localStyles.confirmBtnNoText}>No, not fixed</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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

      {/* ❌ Dispute reason modal: shown when the citizen taps "No, not fixed" */}
      <Modal
        visible={!!disputeModalTicket}
        transparent
        animationType="fade"
        onRequestClose={() => setDisputeModalTicket(null)}
      >
        <View style={localStyles.disputeOverlay}>
          <View style={localStyles.disputeCard}>
            <Text style={localStyles.disputeTitle}>Tell us what's still wrong</Text>
            <Text style={localStyles.disputeSubtitle}>
              This goes straight back to the officer with a fresh 24-hour deadline.
            </Text>
            <TextInput
              style={localStyles.disputeInput}
              placeholder="e.g. the pothole is still there, only half filled..."
              placeholderTextColor="#64748b"
              multiline
              value={disputeNote}
              onChangeText={setDisputeNote}
            />
            <View style={localStyles.disputeButtonRow}>
              <TouchableOpacity
                style={localStyles.disputeCancelBtn}
                onPress={() => { setDisputeModalTicket(null); setDisputeNote(''); }}
              >
                <Text style={localStyles.disputeCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={localStyles.disputeSubmitBtn}
                disabled={confirmingId === disputeModalTicket?.id}
                onPress={handleDisputeSubmit}
              >
                {confirmingId === disputeModalTicket?.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={localStyles.disputeSubmitText}>Reopen Ticket</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(165,243,252,0.15)',
  },
  filterPillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: colors.accent,
  },
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
  shareBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  evidenceWrapper: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  evidenceImage: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  evidenceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  evidenceBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '92%',
    height: '70%',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 8,
  },
  confirmBox: {
    marginTop: 14,
    backgroundColor: 'rgba(56,189,248,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
    borderRadius: 14,
    padding: 12,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmHeaderText: {
    color: '#e0f2fe',
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  confirmButtonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  confirmBtnYes: {
    backgroundColor: '#4ade80',
  },
  confirmBtnYesText: {
    color: '#052e16',
    fontWeight: '700',
    fontSize: 12.5,
    marginLeft: 6,
  },
  confirmBtnNo: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
  },
  confirmBtnNoText: {
    color: '#fca5a5',
    fontWeight: '700',
    fontSize: 12.5,
    marginLeft: 6,
  },
  disputeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  disputeCard: {
    width: '100%',
    backgroundColor: '#0f2027',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
  },
  disputeTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  disputeSubtitle: {
    color: colors.textSecondary,
    fontSize: 12.5,
    marginBottom: 14,
    lineHeight: 17,
  },
  disputeInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    color: '#f1f5f9',
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  disputeButtonRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  disputeCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 8,
  },
  disputeCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  disputeSubmitBtn: {
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  disputeSubmitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
