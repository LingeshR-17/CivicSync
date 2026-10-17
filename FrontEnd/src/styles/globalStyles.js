import { StyleSheet } from 'react-native';
import { civicTheme } from './civicTheme';

// 🏛️ Official Civic Government & Public Portal Theme Tokens
export const colors = {
  bgGradient: civicTheme.colors.gradients.officialNavy,
  glassBg: civicTheme.colors.bgCardSubtle,
  glassBorder: civicTheme.colors.borderSubtle,
  textPrimary: civicTheme.colors.textHeading,
  textSecondary: civicTheme.colors.textMuted,
  accent: civicTheme.colors.civicBlueLight,
  civicBlue: civicTheme.colors.civicBlue,
  civicSaffron: civicTheme.colors.civicSaffron,
  civicGreen: civicTheme.colors.civicGreen,
};

export const styles = StyleSheet.create({
  // ==========================================
  // 🏢 AUTHENTICATION LAYOUT SYSTEM
  // ==========================================
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: civicTheme.colors.bgCardGlass,
    borderWidth: 1,
    borderColor: civicTheme.colors.borderMedium,
    borderRadius: 16,
    padding: 22,
    marginBottom: 20,
    ...civicTheme.shadows.card,
  },
  input: {
    backgroundColor: civicTheme.colors.bgInput,
    borderColor: civicTheme.colors.borderMedium,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: civicTheme.colors.textHeading,
    marginBottom: 16,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: civicTheme.colors.civicBlue,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    ...civicTheme.shadows.subtle,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // ==========================================
  // 📱 MAIN APPLICATION MASTER LAYOUTS
  // ==========================================
  appViewContainer: { flex: 1, backgroundColor: civicTheme.colors.bgMidnight },
  appSafeAreaFrame: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 },
  
  // Official Civic Emblem Header Bar
  searchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBarField: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 34, 64, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: civicTheme.colors.borderMedium,
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    flex: 1,
    marginRight: 12,
  },
  textInputStyle: { flex: 1, color: colors.textPrimary, fontSize: 13 },
  headerProfileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  
  screenHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenHeaderWithBack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  centeredScreenTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.8 },
  leftAlignedScreenTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5 },
  centeredScreenTitleText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.8 },
  
  // Hero Section & Official Portal Badges
  heroTextGroup: { marginBottom: 20 },
  mainTitleText: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },
  subTitleText: { fontSize: 15, fontWeight: '500', color: civicTheme.colors.textMuted, marginTop: 4 },
  
  // Feature Panels & 3D GIS Map Card
  glassCardBase: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: civicTheme.colors.borderMedium,
    backgroundColor: civicTheme.colors.bgCard,
    marginBottom: 22,
    ...civicTheme.shadows.card,
  },
  glassCardGradient: { paddingVertical: 35, alignItems: 'center', justifyContent: 'center' },
  locationMarkerFrame: { marginBottom: 12 },
  locationTitleText: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  locationSubText: { color: colors.textSecondary, fontSize: 12, marginTop: 3, fontWeight: '500' },
  
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: civicTheme.colors.civicBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    ...civicTheme.shadows.subtle,
  },
  primaryActionBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  
  // Department Grid Engine
  gridContainer: { marginTop: 4 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  gridTile: {
    width: '48%',
    aspectRatio: 1.15,
    borderRadius: 14,
    backgroundColor: civicTheme.colors.bgCardSubtle,
    borderWidth: 1,
    borderColor: civicTheme.colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    ...civicTheme.shadows.subtle,
  },
  tileLabelText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginTop: 10, letterSpacing: 0.2 },
  
  // Grievances Summary System
  summaryBannerCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: civicTheme.colors.borderMedium,
    backgroundColor: civicTheme.colors.bgCard,
    marginBottom: 20,
    ...civicTheme.shadows.subtle,
  },
  summaryBannerGradient: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  summaryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerMainTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  bannerSubTitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  
  ticketCardBase: {
    backgroundColor: civicTheme.colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: civicTheme.colors.borderSubtle,
    padding: 16,
    marginBottom: 14,
    ...civicTheme.shadows.subtle,
  },
  ticketRefNumber: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
  ticketStatusText: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '500' },
  progressBarTrack: { height: 5, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, marginVertical: 12, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  ticketDetailsAddress: { color: '#e2e8f0', fontSize: 12, fontWeight: '500' },
  ticketDateStamp: { color: '#64748b', fontSize: 11, marginTop: 4 },
  
  // Account Specific View Configurations
  profileGlassBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: civicTheme.colors.borderMedium,
    backgroundColor: civicTheme.colors.bgCard,
    marginBottom: 22,
  },
  profileBannerGradient: { padding: 18, flexDirection: 'row', alignItems: 'center' },
  profileAvatarFrame: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderWidth: 1.5,
    borderColor: civicTheme.colors.civicBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileNameText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  profileSubEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  
  settingsMenuBox: {
    backgroundColor: civicTheme.colors.bgCardSubtle,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: civicTheme.colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  menuRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemLabelText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  
  // Navigation Components
  navigationTabBarBase: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#050c18',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  tabBarButton: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 10 },
  tabBarLabelText: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  tabActiveBarPointer: {
    width: 16,
    height: 3,
    backgroundColor: civicTheme.colors.civicBlueLight,
    borderRadius: 2,
    marginTop: 4,
    position: 'absolute',
    bottom: -6,
  }
});