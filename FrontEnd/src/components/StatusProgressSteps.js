import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 🎯 UX SIMPLIFICATION: raw backend strings like "IN_PROGRESS" or
// "REOPENED_BY_CITIZEN" mean nothing to a first-time app user. This maps
// every backend status onto one simple 3-step visual: Filed -> Assigned -> Fixed,
// plus a short human label, so someone new to apps can read it at a glance.
const STEPS = ['Filed', 'Assigned', 'Fixed'];

// Maps every backend status to { stepIndex (0,1,2), label, isProblem }.
// stepIndex is how many of the 3 dots should be "filled".
function resolveStepInfo(rawStatus) {
  const status = (rawStatus || 'PENDING').toUpperCase();
  switch (status) {
    case 'PENDING':
      return { stepIndex: 0, label: 'Filed — waiting for an officer', isProblem: false };
    case 'ASSIGNED':
      return { stepIndex: 1, label: 'Assigned to an officer', isProblem: false };
    case 'IN_PROGRESS':
      return { stepIndex: 1, label: 'Officer is on it', isProblem: false };
    case 'REOPENED_BY_CITIZEN':
      return { stepIndex: 1, label: 'Sent back — not fixed yet', isProblem: true };
    case 'RESOLVED':
      return { stepIndex: 2, label: 'Marked fixed — please confirm', isProblem: false };
    case 'CLOSED':
    case 'SOLVED':
      return { stepIndex: 2, label: 'Fixed & closed', isProblem: false };
    default:
      return { stepIndex: 0, label: 'Filed — waiting for an officer', isProblem: false };
  }
}

export default function StatusProgressSteps({ status, color = '#38bdf8', compact = false }) {
  const { stepIndex, label, isProblem } = resolveStepInfo(status);
  const problemColor = '#f97316';
  const activeColor = isProblem ? problemColor : color;

  return (
    <View style={styles.wrapper}>
      <View style={styles.dotsRow}>
        {STEPS.map((stepLabel, i) => {
          const isFilled = i <= stepIndex;
          const isLast = i === STEPS.length - 1;
          return (
            <React.Fragment key={stepLabel}>
              <View style={styles.dotColumn}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isFilled ? activeColor : 'rgba(255,255,255,0.15)' },
                    isFilled && { borderColor: activeColor },
                  ]}
                />
                {!compact && (
                  <Text style={[styles.dotLabel, isFilled && { color: activeColor }]}>{stepLabel}</Text>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: i < stepIndex ? activeColor : 'rgba(255,255,255,0.15)' },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
      <Text style={[styles.statusLabel, { color: activeColor }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 10 },
  dotsRow: { flexDirection: 'row', alignItems: 'center' },
  dotColumn: { alignItems: 'center', width: 60 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dotLabel: { fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  connector: { flex: 1, height: 2, marginHorizontal: -6, marginBottom: 18 },
  statusLabel: { fontSize: 13, fontWeight: '700', marginTop: 6 },
});
