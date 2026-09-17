import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import GrievanceCard from '../../../components/officer/GrievanceCard';
import ResolutionModal from '../../../components/officer/ResolutionModal';
import { useAuth } from '../../../context/AuthContext';
import { fetchOfficerHistory } from '../../../api/api';
import { OFFICER_COLORS, OFFICER_SPACING } from '../officerTheme';

function normalizeTask(dto) {
  return {
    id: dto.id,
    ticketNumber: dto.ticketNumber,
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    address: dto.formattedAddress,
    sla_deadline: dto.slaDeadline,
    citizen_photo_url: dto.citizenPhotoUrl,
    closure_notes: dto.closureNotes,
    image_url: dto.imageUrl,
    video_url: dto.videoUrl,
    completion_photo_url: dto.completionPhotoUrl,
    latitude: dto.latitude,
    longitude: dto.longitude,
  };
}

export default function HistoryLogsTab() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async ({ isRefresh = false } = {}) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOfficerHistory(user.id);
      setHistoryLogs(Array.isArray(data) ? data.map(normalizeTask) : []);
    } catch (e) {
      setError('Unable to load history logs. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const logs = historyLogs.filter(g => ['RESOLVED', 'CLOSED'].includes(g.status));

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={OFFICER_COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <GrievanceCard item={item} onPress={() => handleOpenTask(item)} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadHistory({ isRefresh: true })} colors={[OFFICER_COLORS.accent]} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>{error ? error : 'No resolution logs found.'}</Text>
        }
      />
      {/* Read-only view for a closed/resolved ticket; officer can no longer act on it */}
      <ResolutionModal
        visible={modalVisible}
        selectedTask={selectedTask}
        officerId={user?.id}
        readOnly
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: "transparent" },
  listContent: { padding: OFFICER_SPACING.md, gap: OFFICER_SPACING.md, flexGrow: 1 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: OFFICER_COLORS.textSecondary },
});
