import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import GrievanceCard from '../../../components/officer/GrievanceCard';
import ResolutionModal from '../../../components/officer/ResolutionModal';
import { useAuth } from '../../../context/AuthContext';
import { fetchAssignedTasks } from '../../../api/api';
import { OFFICER_COLORS, OFFICER_SPACING } from '../officerTheme';

// 🔄 Normalizes the backend DTO (camelCase) into the shape GrievanceCard / ResolutionModal expect
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
    image_url: dto.imageUrl,
    video_url: dto.videoUrl,
    latitude: dto.latitude,
    longitude: dto.longitude,
    escalationLevel: dto.escalationLevel,
  };
}

export default function ActiveTasksTab() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [grievances, setGrievances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async ({ isRefresh = false } = {}) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAssignedTasks(user.id);
      setGrievances(Array.isArray(data) ? data.map(normalizeTask) : []);
    } catch (e) {
      setError('Unable to load active tasks. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // This tab remounts each time the officer switches back to "Active" (the
  // dashboard conditionally renders tabs), so loading on mount effectively
  // refreshes it whenever it's revisited — a newly filed & auto-assigned
  // complaint will show up without an app restart.
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const handleResolved = () => {
    setModalVisible(false);
    loadTasks({ isRefresh: true });
  };

  const activeTasks = grievances.filter(g =>
    ['ASSIGNED', 'IN_PROGRESS', 'REOPENED_BY_CITIZEN'].includes(g.status)
  );

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
        data={activeTasks}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <GrievanceCard item={item} onPress={() => handleOpenTask(item)} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadTasks({ isRefresh: true })} colors={[OFFICER_COLORS.accent]} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {error ? error : 'No active tasks assigned.'}
          </Text>
        }
      />
      <ResolutionModal
        visible={modalVisible}
        selectedTask={selectedTask}
        officerId={user?.id}
        onClose={() => setModalVisible(false)}
        onResolved={handleResolved}
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
