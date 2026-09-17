import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, RefreshControl } from 'react-native';
import SupervisorTicketCard from '../../../components/supervisor/SupervisorTicketCard';
import AssignOfficerModal from '../../../components/supervisor/AssignOfficerModal';
import { useAuth } from '../../../context/AuthContext';
import { fetchUnassignedTickets } from '../../../api/api';
import { SUPERVISOR_COLORS, SUPERVISOR_SPACING } from '../supervisorTheme';

export default function UnassignedTab() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadTickets = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUnassignedTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Unable to load unassigned tickets. Pull down to retry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setModalVisible(true);
  };

  const handleAssigned = () => {
    setModalVisible(false);
    loadTickets({ isRefresh: true });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SUPERVISOR_COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <SupervisorTicketCard item={item} onPress={() => handleOpenTicket(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadTickets({ isRefresh: true })} colors={[SUPERVISOR_COLORS.accent]} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {error ? error : 'Nothing unassigned right now — the auto-routing engine has placed every ticket.'}
          </Text>
        }
      />
      <AssignOfficerModal
        visible={modalVisible}
        ticket={selectedTicket}
        supervisorId={user?.id}
        onClose={() => setModalVisible(false)}
        onAssigned={handleAssigned}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  listContent: { padding: SUPERVISOR_SPACING.md, gap: SUPERVISOR_SPACING.md, flexGrow: 1 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14, lineHeight: 20, color: SUPERVISOR_COLORS.textSecondary, paddingHorizontal: 20 },
});
